package com.kisanlink.dto;

import com.kisanlink.entity.PriceTrend;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Rich statistical price forecast response containing estimated price,
 * labeled confidence intervals (80%, 90%, 95%), volatility indicators,
 * and multi-day price trajectory projections.
 */
public record PredictionResponse(
        Long cropId,
        String cropName,
        LocalDate predictionDate,
        BigDecimal estimatedPrice,
        BigDecimal lowerBound,
        BigDecimal upperBound,
        PriceTrend trend,
        Double confidenceScore,
        String confidenceLabel,
        String volatilityLevel,
        Integer historicalPointsCount,
        List<ConfidenceInterval> confidenceIntervals,
        List<ForecastPoint> multiDayForecast,
        String methodology,
        String disclaimer
) {
}
