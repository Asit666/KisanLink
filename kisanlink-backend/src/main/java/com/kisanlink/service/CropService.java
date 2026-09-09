package com.kisanlink.service;

import com.kisanlink.dto.BuyerRequirementResponse;
import com.kisanlink.dto.CropProduceResponse;
import com.kisanlink.dto.MandiComparisonResponse;
import com.kisanlink.entity.Crop;
import com.kisanlink.entity.CropCategory;
import com.kisanlink.entity.Market;
import com.kisanlink.entity.MarketPrice;
import com.kisanlink.repository.BuyerRequirementRepository;
import com.kisanlink.repository.CropRepository;
import com.kisanlink.repository.FarmerProduceRepository;
import com.kisanlink.repository.MarketPriceRepository;
import com.kisanlink.repository.MarketRepository;
import com.kisanlink.util.DistanceCalculator;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CropService {
    private final CropRepository cropRepository;
    private final FarmerProduceRepository produceRepository;
    private final BuyerRequirementRepository requirementRepository;
    private final MarketPriceRepository marketPriceRepository;
    private final MarketRepository marketRepository;

    public CropService(CropRepository cropRepository,
                       FarmerProduceRepository produceRepository,
                       BuyerRequirementRepository requirementRepository,
                       MarketPriceRepository marketPriceRepository,
                       MarketRepository marketRepository) {
        this.cropRepository = cropRepository;
        this.produceRepository = produceRepository;
        this.requirementRepository = requirementRepository;
        this.marketPriceRepository = marketPriceRepository;
        this.marketRepository = marketRepository;
    }

    public List<Crop> findAll() {
        return cropRepository.findAll();
    }

    public List<Crop> findByCategory(CropCategory category) {
        return cropRepository.findByCategory(category);
    }

    public List<CropCategory> findAllCategories() {
        return Arrays.asList(CropCategory.values());
    }

    public Crop findById(Long id) {
        return cropRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Crop not found: " + id));
    }

    public List<Crop> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return findAll();
        }
        return cropRepository.findByNameContainingIgnoreCase(query.trim());
    }

    public Crop create(Crop crop) {
        return cropRepository.save(crop);
    }

    public List<CropProduceResponse> findProduceByCrop(Long cropId) {
        Crop crop = findById(cropId);
        return produceRepository.findByCropId(crop.getId()).stream()
                .map(p -> new CropProduceResponse(
                        p.getId(),
                        p.getFarmer() != null ? p.getFarmer().getId() : null,
                        p.getFarmer() != null ? p.getFarmer().getName() : "Local Producer",
                        p.getFarmer() != null && p.getFarmer().getDistrict() != null ? p.getFarmer().getDistrict() : "Regional Hub",
                        p.getFarmer() != null && p.getFarmer().getState() != null ? p.getFarmer().getState() : "State",
                        crop.getId(),
                        crop.getName(),
                        p.getQuantity(),
                        crop.getUnit(),
                        p.getQuality() != null ? p.getQuality() : "Grade A",
                        p.getExpectedPrice(),
                        p.getHarvestDate(),
                        p.getAvailableUntil(),
                        p.getDescription(),
                        p.getImageUrl()
                )).toList();
    }

    public List<MandiComparisonResponse> getMandiComparison(Long cropId, Double userLat, Double userLon) {
        Crop crop = findById(cropId);
        List<MarketPrice> latestPrices = marketPriceRepository.findByCropIdOrderByDateDesc(crop.getId());

        Map<Long, MarketPrice> marketMap = new LinkedHashMap<>();
        for (MarketPrice mp : latestPrices) {
            if (mp.getMarket() != null && !marketMap.containsKey(mp.getMarket().getId())) {
                marketMap.put(mp.getMarket().getId(), mp);
            }
        }

        double baseLat = userLat != null ? userLat : 20.0;
        double baseLon = userLon != null ? userLon : 74.0;

        return marketMap.values().stream().map(mp -> {
            Market m = mp.getMarket();
            double dist = 25.0;
            if (m.getLatitude() != null && m.getLongitude() != null) {
                BigDecimal distBD = DistanceCalculator.between(baseLat, baseLon, m.getLatitude(), m.getLongitude());
                dist = distBD.doubleValue();
            }
            // Estimated freight deduction: ~₹3.5 per quintal per km -> ~₹0.035 per kg per km
            BigDecimal freightPerKg = BigDecimal.valueOf(dist * 0.035).setScale(2, RoundingMode.HALF_UP);
            BigDecimal netRealization = mp.getModalPrice().subtract(freightPerKg);
            if (netRealization.compareTo(BigDecimal.ZERO) < 0) {
                netRealization = mp.getModalPrice();
            }

            return new MandiComparisonResponse(
                    m.getId(),
                    m.getName(),
                    m.getDistrict(),
                    m.getState(),
                    mp.getModalPrice(),
                    mp.getMinPrice(),
                    mp.getMaxPrice(),
                    mp.getDate(),
                    Math.round(dist * 10.0) / 10.0,
                    freightPerKg,
                    netRealization
            );
        }).toList();
    }

    public List<BuyerRequirementResponse> findRequirementsByCrop(Long cropId) {
        Crop crop = findById(cropId);
        return requirementRepository.findByCropId(crop.getId()).stream()
                .map(r -> new BuyerRequirementResponse(
                        r.getId(),
                        r.getBuyer() != null ? r.getBuyer().getId() : null,
                        r.getBuyer() != null && r.getBuyer().getUser() != null ? r.getBuyer().getUser().getName() : "Commercial Agro Purchaser",
                        r.getBuyer() != null && r.getBuyer().getBusinessName() != null ? r.getBuyer().getBusinessName() : "Priya Agro Wholesale & Retail Hub",
                        crop.getId(),
                        crop.getName(),
                        r.getRequiredQuantity(),
                        r.getQualityRequired() != null ? r.getQualityRequired() : "Grade A",
                        r.getOfferedPrice(),
                        r.getLocation() != null ? r.getLocation() : "Regional APMC Terminal Yard",
                        r.getValidUntil()
                )).toList();
    }
}


