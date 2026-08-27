package com.kisanlink.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class ProfitCalculator {
    private ProfitCalculator() {
    }

    public static BigDecimal revenue(BigDecimal price, BigDecimal quantity) {
        return price.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Transport cost using the default hard-coded rates (₹100 base + ₹15/km).
     * Kept for backward compatibility; prefer the configurable overload.
     */
    public static BigDecimal transport(BigDecimal distanceKm) {
        return transport(distanceKm, new BigDecimal("100.00"), new BigDecimal("15.00"));
    }

    /**
     * Transport cost using configurable rates.
     *
     * @param distanceKm  haversine distance in kilometres
     * @param baseCharge  fixed per-trip charge (₹)
     * @param ratePerKm   variable cost per kilometre (₹/km)
     * @return total transport cost rounded to 2 dp
     */
    public static BigDecimal transport(BigDecimal distanceKm, BigDecimal baseCharge, BigDecimal ratePerKm) {
        return distanceKm.multiply(ratePerKm)
                .add(baseCharge)
                .setScale(2, RoundingMode.HALF_UP);
    }
}
