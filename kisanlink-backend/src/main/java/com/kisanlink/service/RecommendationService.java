package com.kisanlink.service;

import com.kisanlink.config.RecommendationConfig;
import com.kisanlink.dto.RecommendationOption;
import com.kisanlink.dto.RecommendationRequest;
import com.kisanlink.dto.RecommendationResponse;
import com.kisanlink.entity.*;
import com.kisanlink.repository.*;
import com.kisanlink.util.DistanceCalculator;
import com.kisanlink.util.ProfitCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class RecommendationService {
    private final FarmerRepository farmerRepository;
    private final FarmerProduceRepository produceRepository;
    private final BuyerRequirementRepository requirementRepository;
    private final RecommendationRepository recommendationRepository;
    private final TransporterRepository transporterRepository;
    private final RecommendationConfig config;
    private final ScoringService scoringService;
    private final com.kisanlink.security.OwnershipService ownershipService;

    public RecommendationService(FarmerRepository farmerRepository,
                                 FarmerProduceRepository produceRepository,
                                 BuyerRequirementRepository requirementRepository,
                                 RecommendationRepository recommendationRepository,
                                 TransporterRepository transporterRepository,
                                 RecommendationConfig config,
                                 ScoringService scoringService,
                                 com.kisanlink.security.OwnershipService ownershipService) {
        this.farmerRepository = farmerRepository;
        this.produceRepository = produceRepository;
        this.requirementRepository = requirementRepository;
        this.recommendationRepository = recommendationRepository;
        this.transporterRepository = transporterRepository;
        this.config = config;
        this.scoringService = scoringService;
        this.ownershipService = ownershipService;
    }

    @Transactional
    public RecommendationResponse recommend(RecommendationRequest request, String userEmail) {
        Farmer farmer = farmerRepository.findById(request.farmerId())
                .orElseThrow(() -> new IllegalArgumentException("Farmer not found: " + request.farmerId()));
        if (userEmail != null) {
            ownershipService.checkFarmerOwnership(farmer.getId(), userEmail);
        }

        FarmerProduce produce = produceRepository.findById(request.produceId())
                .orElseThrow(() -> new IllegalArgumentException("Produce not found: " + request.produceId()));

        if (!produce.getFarmer().getId().equals(farmer.getId())) {
            throw new IllegalArgumentException("Produce listing #" + request.produceId() + " does not belong to Farmer #" + farmer.getId());
        }

        // 1. Build raw options — filter by validity, quality match, and max distance
        double maxDistKm = config.getTransport().getMaxDistanceKm();
        List<RecommendationOption> raw = requirementRepository
                .findByCropId(produce.getCrop().getId()).stream()
                .filter(req -> req.getValidUntil() == null
                        || !req.getValidUntil().isBefore(LocalDate.now()))
                .filter(req -> qualityMatches(produce.getQuality(), req.getQualityRequired()))
                .map(req -> rawOption(farmer, produce, req))
                .filter(opt -> opt.distanceKm() != null && opt.distanceKm().doubleValue() <= maxDistKm)
                .toList();

        if (raw.isEmpty()) {
            throw new IllegalArgumentException("No compatible buyer requirements found within " + maxDistKm + " km");
        }

        // 2. Apply weighted multi-factor scoring — sorted by score descending
        List<RecommendationOption> scored = scoringService.score(raw);

        RecommendationOption best = scored.getFirst();

        // 3. Resolve winning buyer entity
        Buyer buyer = requirementRepository.findByCropId(produce.getCrop().getId()).stream()
                .filter(req -> req.getBuyer().getId().equals(best.buyerId()))
                .findFirst().orElseThrow().getBuyer();

        // 4. Persist the recommendation
        Recommendation saved = new Recommendation();
        saved.setFarmer(farmer);
        saved.setProduce(produce);
        saved.setBuyer(buyer);
        saved.setSellingPrice(best.pricePerKg());
        saved.setTransportCost(best.transportCost());
        saved.setGrossRevenue(best.grossRevenue());
        saved.setNetReturn(best.netReturn());
        saved.setScore(best.score());
        saved.setReason(buildReasonSummary(best, scored, buyer.isVerified()));
        recommendationRepository.save(saved);

        // 5. Build rich reason list for the response
        List<String> reasons = scoringService.reasons(best, scored, buyer.isVerified());

        return new RecommendationResponse(
                produce.getCrop().getName(),
                produce.getQuantity(),
                best,
                reasons,
                scored.subList(1, scored.size())
        );
    }

    public List<Recommendation> history(Long farmerId, String userEmail) {
        if (userEmail != null) {
            ownershipService.checkFarmerOwnership(farmerId, userEmail);
        }
        return recommendationRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
    }

    private boolean qualityMatches(String produceQuality, String reqQuality) {
        if (produceQuality == null || reqQuality == null) return false;
        String p = produceQuality.replace("_", " ").replace("-", " ").trim().toUpperCase();
        String r = reqQuality.replace("_", " ").replace("-", " ").trim().toUpperCase();
        return p.equalsIgnoreCase(r);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Builds a single option pairing the buyer requirement with the optimal available transporter.
     */
    private RecommendationOption rawOption(Farmer farmer, FarmerProduce produce, BuyerRequirement requirement) {
        BigDecimal routeDistance = DistanceCalculator.between(
                farmer.getLatitude(), farmer.getLongitude(),
                requirement.getBuyer().getLatitude(), requirement.getBuyer().getLongitude());

        if (routeDistance == null) {
            routeDistance = BigDecimal.valueOf(config.getTransport().getMaxDistanceKm()).setScale(2, RoundingMode.HALF_UP);
        }

        // Query available fleet carriers matching capacity
        List<Transporter> availableTransporters = transporterRepository.findAvailableWithMinCapacity(produce.getQuantity());
        if (availableTransporters.isEmpty()) {
            availableTransporters = transporterRepository.findByAvailableTrue();
        }

        Transporter bestCarrier = null;
        BigDecimal bestFreightCost = null;

        if (!availableTransporters.isEmpty()) {
            for (Transporter t : availableTransporters) {
                BigDecimal freight = t.getBaseCharge().add(routeDistance.multiply(t.getRatePerKm())).setScale(2, RoundingMode.HALF_UP);
                if (bestFreightCost == null || freight.compareTo(bestFreightCost) < 0) {
                    bestFreightCost = freight;
                    bestCarrier = t;
                }
            }
        }

        if (bestFreightCost == null) {
            bestFreightCost = ProfitCalculator.transport(
                    routeDistance,
                    config.getTransport().getBaseCharge(),
                    config.getTransport().getRatePerKm());
        }

        BigDecimal gross = ProfitCalculator.revenue(requirement.getOfferedPrice(), produce.getQuantity());
        BigDecimal platformFee = BigDecimal.valueOf(100.00).setScale(2, RoundingMode.HALF_UP);
        BigDecimal net = gross.subtract(bestFreightCost).subtract(platformFee).setScale(2, RoundingMode.HALF_UP);

        Long carrierId = bestCarrier != null ? bestCarrier.getId() : null;
        String carrierName = bestCarrier != null && bestCarrier.getUser() != null ? bestCarrier.getUser().getName() : "Regional Agro-Fleet";
        String carrierVehicle = bestCarrier != null ? bestCarrier.getVehicleType().name() : "MINI_TRUCK";
        BigDecimal carrierRate = bestCarrier != null ? bestCarrier.getRatePerKm() : config.getTransport().getRatePerKm();
        BigDecimal carrierBase = bestCarrier != null ? bestCarrier.getBaseCharge() : config.getTransport().getBaseCharge();

        return new RecommendationOption(
                requirement.getBuyer().getId(),
                requirement.getBuyer().getBusinessName(),
                requirement.getOfferedPrice(),
                routeDistance,
                bestFreightCost,
                gross,
                net,
                BigDecimal.ZERO,          // placeholder — overwritten by ScoringService
                requirement.getBuyer().isVerified(),
                carrierId,
                carrierName,
                carrierVehicle,
                carrierRate,
                carrierBase,
                platformFee,
                null
        );
    }

    private String buildReasonSummary(RecommendationOption best, List<RecommendationOption> all, boolean verified) {
        return String.format(
                "Weighted score: %.2f/100; net return: ₹%.2f; transport: ₹%.2f; distance: %.1f km; verified buyer: %s",
                best.score().doubleValue(),
                best.netReturn().doubleValue(),
                best.transportCost().doubleValue(),
                best.distanceKm().doubleValue(),
                verified
        );
    }
}

