package com.kisanlink.service;

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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class RecommendationService {
    private final FarmerRepository farmerRepository;
    private final FarmerProduceRepository produceRepository;
    private final BuyerRequirementRepository requirementRepository;
    private final RecommendationRepository recommendationRepository;

    public RecommendationService(FarmerRepository farmerRepository, FarmerProduceRepository produceRepository,
                                 BuyerRequirementRepository requirementRepository,
                                 RecommendationRepository recommendationRepository) {
        this.farmerRepository = farmerRepository;
        this.produceRepository = produceRepository;
        this.requirementRepository = requirementRepository;
        this.recommendationRepository = recommendationRepository;
    }

    @Transactional
    public RecommendationResponse recommend(RecommendationRequest request) {
        Farmer farmer = farmerRepository.findById(request.farmerId())
                .orElseThrow(() -> new IllegalArgumentException("Farmer not found: " + request.farmerId()));
        FarmerProduce produce = produceRepository.findById(request.produceId())
                .orElseThrow(() -> new IllegalArgumentException("Produce not found: " + request.produceId()));

        List<RecommendationOption> options = requirementRepository.findByCropId(produce.getCrop().getId()).stream()
                .filter(requirement -> requirement.getValidUntil() == null
                        || !requirement.getValidUntil().isBefore(LocalDate.now()))
                .filter(requirement -> requirement.getQualityRequired().equalsIgnoreCase(produce.getQuality()))
                .map(requirement -> option(farmer, produce, requirement))
                .sorted(Comparator.comparing(RecommendationOption::netReturn).reversed())
                .toList();

        if (options.isEmpty()) {
            throw new IllegalArgumentException("No compatible buyer requirements found");
        }

        RecommendationOption best = options.getFirst();
        Buyer buyer = requirementRepository.findByCropId(produce.getCrop().getId()).stream()
                .filter(requirement -> requirement.getBuyer().getId().equals(best.buyerId()))
                .findFirst().orElseThrow().getBuyer();
        Recommendation saved = new Recommendation();
        saved.setFarmer(farmer);
        saved.setProduce(produce);
        saved.setBuyer(buyer);
        saved.setSellingPrice(best.pricePerKg());
        saved.setTransportCost(best.transportCost());
        saved.setGrossRevenue(best.grossRevenue());
        saved.setNetReturn(best.netReturn());
        saved.setScore(best.score());
        saved.setReason("Highest estimated net return; quality requirement matches; verified buyer: " + buyer.isVerified());
        recommendationRepository.save(saved);

        List<String> reasons = new ArrayList<>();
        reasons.add("Highest estimated net return");
        reasons.add("Quality requirement matches");
        if (buyer.isVerified()) reasons.add("Buyer is verified");
        return new RecommendationResponse(produce.getCrop().getName(), produce.getQuantity(), best, reasons,
                options.subList(1, options.size()));
    }

    public List<Recommendation> history(Long farmerId) {
        return recommendationRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
    }

    private RecommendationOption option(Farmer farmer, FarmerProduce produce, BuyerRequirement requirement) {
        BigDecimal distance = DistanceCalculator.between(farmer.getLatitude(), farmer.getLongitude(),
                requirement.getBuyer().getLatitude(), requirement.getBuyer().getLongitude());
        BigDecimal transport = ProfitCalculator.transport(distance);
        BigDecimal gross = ProfitCalculator.revenue(requirement.getOfferedPrice(), produce.getQuantity());
        BigDecimal net = gross.subtract(transport).setScale(2, RoundingMode.HALF_UP);
        BigDecimal score = net.max(BigDecimal.ZERO).divide(gross.max(BigDecimal.ONE), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
        return new RecommendationOption(requirement.getBuyer().getId(), requirement.getBuyer().getBusinessName(),
                requirement.getOfferedPrice(), distance, transport, gross, net, score);
    }
}
