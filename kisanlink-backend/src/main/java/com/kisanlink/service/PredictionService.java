package com.kisanlink.service;

import com.kisanlink.dto.PredictionResponse;
import com.kisanlink.entity.PricePrediction;
import com.kisanlink.entity.PriceTrend;
import com.kisanlink.repository.CropRepository;
import com.kisanlink.repository.MarketPriceRepository;
import com.kisanlink.repository.PricePredictionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class PredictionService {
    private final CropRepository cropRepository;
    private final MarketPriceRepository priceRepository;
    private final PricePredictionRepository predictionRepository;

    public PredictionService(CropRepository cropRepository, MarketPriceRepository priceRepository,
                             PricePredictionRepository predictionRepository) {
        this.cropRepository = cropRepository;
        this.priceRepository = priceRepository;
        this.predictionRepository = predictionRepository;
    }

    public List<PricePrediction> findByCrop(Long cropId) {
        return predictionRepository.findByCropIdOrderByPredictionDateAsc(cropId);
    }

    public List<PricePrediction> findByCropAndMarket(Long cropId, Long marketId) {
        return predictionRepository.findByCropIdAndMarketIdOrderByPredictionDateAsc(cropId, marketId);
    }

    public PredictionResponse estimate(Long cropId) {
        var crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new IllegalArgumentException("Crop not found: " + cropId));
        var prices = priceRepository.findByCropIdOrderByDateDesc(cropId);
        if (prices.isEmpty()) throw new IllegalArgumentException("No price history found for crop: " + cropId);
        BigDecimal latest = prices.getFirst().getModalPrice();
        BigDecimal change = prices.size() > 1 ? latest.subtract(prices.get(1).getModalPrice()) : BigDecimal.ZERO;
        PriceTrend trend = change.signum() > 0 ? PriceTrend.UPWARD
                : change.signum() < 0 ? PriceTrend.DOWNWARD : PriceTrend.STABLE;
        BigDecimal estimate = latest.add(change).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        BigDecimal margin = estimate.multiply(BigDecimal.valueOf(0.10)).setScale(2, RoundingMode.HALF_UP);
        PricePrediction prediction = new PricePrediction();
        prediction.setCrop(crop);
        prediction.setPredictionDate(LocalDate.now().plusDays(1));
        prediction.setPredictedPrice(estimate);
        prediction.setLowerBound(estimate.subtract(margin).max(BigDecimal.ZERO));
        prediction.setUpperBound(estimate.add(margin));
        prediction.setTrend(trend);
        predictionRepository.save(prediction);
        return new PredictionResponse(prediction.getPredictionDate(), estimate, prediction.getLowerBound(),
                prediction.getUpperBound(), trend, "Estimate from recent modal prices; not a guaranteed price.");
    }
}
