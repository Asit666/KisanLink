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
    private final RecommendationConfig config;
    private final ScoringService scoringService;

    public RecommendationService(FarmerRepository farmerRepository,
                                 FarmerProduceRepository produceRepository,
                                 BuyerRequirementRepository requirementRepository,
                                 RecommendationRepository recommendationRepository,
                                 RecommendationConfig config,
                                 ScoringService scoringService) {
        this.farmerRepository = farmerRepository;
        this.produceRepository = produceRepository;
        this.requirementRepository = requirementRepository;
        this.recommendationRepository = recommendationRepository;
        this.config = config;
        this.scoringService = scoringService;
    }

    @Transactional
    public RecommendationResponse recommend(RecommendationRequest request) {
        Farmer farmer = farmerRepository.findById(request.farmerId())
                .orElseThrow(() -> new IllegalArgumentException("Farmer not found: " + request.farmerId()));
        FarmerProduce produce = produceRepository.findById(request.produceId())
                .orElseThrow(() -> new IllegalArgumentException("Produce not found: " + request.produceId()));

        // 1. Build raw options — filter by validity, quality match, and max distance
        double maxDistKm = config.getTransport().getMaxDistanceKm();
        List<RecommendationOption> raw = requirementRepository
                .findByCropId(produce.getCrop().getId()).stream()
                .filter(req -> req.getValidUntil() == null
                        || !req.getValidUntil().isBefore(LocalDate.now()))
                .filter(req -> req.getQualityRequired().equalsIgnoreCase(produce.getQuality()))
                .map(req -> rawOption(farmer, produce, req))
                .filter(opt -> opt.distanceKm().doubleValue() <= maxDistKm)
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

    public List<Recommendation> history(Long farmerId) {
        return recommendationRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Builds a single option with financial data using the configured transport rates.
     * The weighted {@code score} is set to a preliminary value of ZERO here;
     * it will be replaced by {@link ScoringService#score(List)} in the next step.
     */
    private RecommendationOption rawOption(Farmer farmer, FarmerProduce produce, BuyerRequirement requirement) {
        BigDecimal distance = DistanceCalculator.between(
                farmer.getLatitude(), farmer.getLongitude(),
                requirement.getBuyer().getLatitude(), requirement.getBuyer().getLongitude());

        // Use configured transport rates
        BigDecimal transport = ProfitCalculator.transport(
                distance,
                config.getTransport().getBaseCharge(),
                config.getTransport().getRatePerKm());

        BigDecimal gross = ProfitCalculator.revenue(requirement.getOfferedPrice(), produce.getQuantity());
        BigDecimal net = gross.subtract(transport).setScale(2, RoundingMode.HALF_UP);

        return new RecommendationOption(
                requirement.getBuyer().getId(),
                requirement.getBuyer().getBusinessName(),
                requirement.getOfferedPrice(),
                distance,
                transport,
                gross,
                net,
                BigDecimal.ZERO,          // placeholder — overwritten by ScoringService
                requirement.getBuyer().isVerified()
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
