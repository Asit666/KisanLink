package com.kisanlink.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MandiComparisonResponse(
        Long marketId,
        String marketName,
        String district,
        String state,
        BigDecimal modalPrice,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        LocalDate date,
        Double distanceKm,
        BigDecimal estimatedFreightCost,
        BigDecimal estimatedNetRealization
) {
}
