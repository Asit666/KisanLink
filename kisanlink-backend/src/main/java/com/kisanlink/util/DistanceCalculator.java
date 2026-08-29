package com.kisanlink.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class DistanceCalculator {
    private DistanceCalculator() {
    }

    public static BigDecimal between(Double firstLatitude, Double firstLongitude,
                                     Double secondLatitude, Double secondLongitude) {
        if (firstLatitude == null || firstLongitude == null || secondLatitude == null || secondLongitude == null) {
            return null;
        }
        double latDistance = Math.toRadians(secondLatitude - firstLatitude);
        double lonDistance = Math.toRadians(secondLongitude - firstLongitude);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(firstLatitude)) * Math.cos(Math.toRadians(secondLatitude))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        return BigDecimal.valueOf(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
                .setScale(2, RoundingMode.HALF_UP);
    }

}
