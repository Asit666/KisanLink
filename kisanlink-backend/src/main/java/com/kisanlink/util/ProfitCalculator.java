package com.kisanlink.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class ProfitCalculator {
    private ProfitCalculator() {
    }

    public static BigDecimal revenue(BigDecimal price, BigDecimal quantity) {
        return price.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal transport(BigDecimal distanceKm) {
        return distanceKm.multiply(BigDecimal.valueOf(15)).add(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }
}
