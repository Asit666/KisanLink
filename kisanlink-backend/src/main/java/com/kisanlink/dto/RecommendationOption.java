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
        boolean buyerVerified,
        Long transporterId,
        String transporterName,
        String vehicleType,
        BigDecimal transporterRatePerKm,
        BigDecimal transporterBaseCharge,
        BigDecimal platformFee,
        String profitComparisonNote
) {
    public RecommendationOption(
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
        this(buyerId, buyerName, pricePerKg, distanceKm, transportCost, grossRevenue, netReturn, score, buyerVerified,
                null, null, null, null, null, BigDecimal.valueOf(100), null);
    }
}
