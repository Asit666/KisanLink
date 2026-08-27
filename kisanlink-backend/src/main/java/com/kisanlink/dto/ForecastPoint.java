package com.kisanlink.dto;

import com.kisanlink.entity.PriceTrend;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Forecast data point for a specific day in the future with labeled confidence bands.
 */
public record ForecastPoint(
        LocalDate date,
        Integer dayAhead,
        BigDecimal predictedPrice,
        BigDecimal lowerBound,
        BigDecimal upperBound,
        PriceTrend trend,
        ConfidenceInterval interval80,
        ConfidenceInterval interval90,
        ConfidenceInterval interval95
) {
}
