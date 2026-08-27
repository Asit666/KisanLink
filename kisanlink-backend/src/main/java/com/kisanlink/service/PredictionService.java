package com.kisanlink.service;

import com.kisanlink.dto.ConfidenceInterval;
import com.kisanlink.dto.ForecastPoint;
import com.kisanlink.dto.PredictionResponse;
import com.kisanlink.entity.Crop;
import com.kisanlink.entity.MarketPrice;
import com.kisanlink.entity.PricePrediction;
import com.kisanlink.entity.PriceTrend;
import com.kisanlink.repository.CropRepository;
import com.kisanlink.repository.MarketPriceRepository;
import com.kisanlink.repository.PricePredictionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Advanced statistical time-series price prediction service.
 * Applies linear trend regression, sample volatility analysis, and computes
 * labeled confidence intervals (80%, 90%, 95%) across multi-day forecast horizons.
 */
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

    @Transactional
    public PredictionResponse estimate(Long cropId) {
        return forecast(cropId, 7);
    }

    @Transactional
    public PredictionResponse forecast(Long cropId, int daysAhead) {
        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new IllegalArgumentException("Crop not found: " + cropId));

        List<MarketPrice> rawPrices = priceRepository.findByCropIdOrderByDateDesc(cropId);
        if (rawPrices.isEmpty()) {
            throw new IllegalArgumentException("No price history found for crop: " + cropId);
        }

        // Chronological order: [oldest, ..., latest]
        List<MarketPrice> history = new ArrayList<>(rawPrices);
        Collections.reverse(history);

        int n = history.size();
        double[] prices = history.stream().mapToDouble(p -> p.getModalPrice().doubleValue()).toArray();
        double latestPrice = prices[n - 1];

        // 1. Compute Linear Regression Slope (beta) and Mean
        double sumX = 0;
        double sumY = 0;
        for (int i = 0; i < n; i++) {
            sumX += (i + 1);
            sumY += prices[i];
        }
        double meanX = sumX / n;
        double meanY = sumY / n;

        double sumXX = 0;
        double sumXY = 0;
        for (int i = 0; i < n; i++) {
            double dx = (i + 1) - meanX;
            double dy = prices[i] - meanY;
            sumXX += dx * dx;
            sumXY += dx * dy;
        }

        double beta = (sumXX > 0) ? (sumXY / sumXX) : 0.0;

        // 2. Compute Sample Volatility (Standard Deviation of Residuals)
        double sumResidualSq = 0;
        for (int i = 0; i < n; i++) {
            double fitted = meanY + beta * ((i + 1) - meanX);
            double res = prices[i] - fitted;
            sumResidualSq += res * res;
        }

        double dof = Math.max(1, n - 2);
        double s = (n >= 3) ? Math.sqrt(sumResidualSq / dof) : (latestPrice * 0.05);

        // Enforce baseline minimum standard error (at least 2% of price or 0.50)
        s = Math.max(s, Math.max(latestPrice * 0.02, 0.50));

        // Volatility classification
        double volPct = (latestPrice > 0) ? ((s / latestPrice) * 100.0) : 5.0;
        String volatilityLevel = (volPct <= 4.0) ? "LOW" : (volPct <= 10.0) ? "MODERATE" : "HIGH";

        // Confidence score calculation (0 - 100%)
        double confidenceScore = Math.min(98.0, Math.max(55.0, 65.0 + Math.min(n * 3.5, 25.0) - Math.min(volPct * 1.2, 20.0)));
        confidenceScore = Math.round(confidenceScore * 10.0) / 10.0;
        String confidenceLabel = (confidenceScore >= 85.0) ? "HIGH_CONFIDENCE" : (confidenceScore >= 70.0) ? "MODERATE_CONFIDENCE" : "INDICATIVE";

        // Determine Overall Trend Direction
        PriceTrend overallTrend = (beta > 0.15) ? PriceTrend.UPWARD : (beta < -0.15) ? PriceTrend.DOWNWARD : PriceTrend.STABLE;

        // 3. Multi-day Forecast Trajectory
        int horizon = Math.max(1, Math.min(daysAhead, 14));
        List<ForecastPoint> multiDayPoints = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int h = 1; h <= horizon; h++) {
            LocalDate targetDate = today.plusDays(h);
            // Dampen slope over future horizons for stability
            double damping = Math.pow(0.92, h - 1);
            double projected = Math.max(1.0, latestPrice + beta * h * damping);

            // Standard Error of forecast at horizon h
            double denom = (sumXX > 0) ? sumXX : 1.0;
            double se = s * Math.sqrt(1.0 + (1.0 / n) + (Math.pow((n + h) - meanX, 2) / denom));

            // Z-multipliers for confidence levels
            double m80 = 1.280 * se;
            double m90 = 1.645 * se;
            double m95 = 1.960 * se;

            BigDecimal pointPrice = round(projected);
            ConfidenceInterval ci80 = new ConfidenceInterval("80% Core Band", 0.80, round(Math.max(0.50, projected - m80)), round(projected + m80));
            ConfidenceInterval ci90 = new ConfidenceInterval("90% Likely Range", 0.90, round(Math.max(0.50, projected - m90)), round(projected + m90));
            ConfidenceInterval ci95 = new ConfidenceInterval("95% Conservative Boundary", 0.95, round(Math.max(0.50, projected - m95)), round(projected + m95));

            PriceTrend pointTrend = (projected > latestPrice + 0.10) ? PriceTrend.UPWARD
                    : (projected < latestPrice - 0.10) ? PriceTrend.DOWNWARD : PriceTrend.STABLE;

            multiDayPoints.add(new ForecastPoint(
                    targetDate,
                    h,
                    pointPrice,
                    ci90.lowerBound(),
                    ci90.upperBound(),
                    pointTrend,
                    ci80,
                    ci90,
                    ci95
            ));
        }

        ForecastPoint primaryPoint = multiDayPoints.getFirst();
        List<ConfidenceInterval> primaryIntervals = List.of(
                primaryPoint.interval80(),
                primaryPoint.interval90(),
                primaryPoint.interval95()
        );

        // 4. Persist primary prediction record
        PricePrediction prediction = new PricePrediction();
        prediction.setCrop(crop);
        prediction.setPredictionDate(primaryPoint.date());
        prediction.setPredictedPrice(primaryPoint.predictedPrice());
        prediction.setLowerBound(primaryPoint.interval90().lowerBound());
        prediction.setUpperBound(primaryPoint.interval90().upperBound());
        prediction.setTrend(overallTrend);
        prediction.setModelVersion("stat-timeseries-v2");
        predictionRepository.save(prediction);

        String methodology = String.format(
                "Time-series linear regression with residual volatility (beta=%.2f, sigma=%.2f, n=%d).",
                beta, s, n
        );
        String disclaimer = "Statistical projection based on historical mandi price series; actual market arrival prices may vary with real-time demand and weather.";

        return new PredictionResponse(
                crop.getId(),
                crop.getName(),
                primaryPoint.date(),
                primaryPoint.predictedPrice(),
                primaryPoint.interval90().lowerBound(),
                primaryPoint.interval90().upperBound(),
                overallTrend,
                confidenceScore,
                confidenceLabel,
                volatilityLevel,
                n,
                primaryIntervals,
                multiDayPoints,
                methodology,
                disclaimer
        );
    }

    private static BigDecimal round(double val) {
        return BigDecimal.valueOf(val).setScale(2, RoundingMode.HALF_UP);
    }
}
