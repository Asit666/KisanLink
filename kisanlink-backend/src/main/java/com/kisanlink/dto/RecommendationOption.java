package com.kisanlink.dto;

import java.math.BigDecimal;

public record RecommendationOption(
        Long buyerId,
        String buyerName,
        BigDecimal pricePerKg,
        BigDecimal distanceKm,
        BigDecimal transportCost,
        BigDecimal grossRevenue,
        BigDecimal netReturn,
        BigDecimal score,
        boolean buyerVerified
) {
}
