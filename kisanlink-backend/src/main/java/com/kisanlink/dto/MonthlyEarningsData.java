package com.kisanlink.dto;

import java.math.BigDecimal;

public record MonthlyEarningsData(
        String month,
        BigDecimal totalRevenue,
        BigDecimal totalVolumeKg,
        BigDecimal totalVolumeTons,
        int completedTradesCount,
        BigDecimal realizedPremiumPercent,
        BigDecimal extraProfitRupees
) {
}
