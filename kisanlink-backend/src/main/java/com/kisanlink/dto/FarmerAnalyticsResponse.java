package com.kisanlink.dto;

import java.math.BigDecimal;
import java.util.List;

public record FarmerAnalyticsResponse(
        Long farmerId,
        String farmerName,
        String district,
        BigDecimal totalLifetimeRevenue,
        BigDecimal totalLifetimeVolumeKg,
        BigDecimal totalLifetimeVolumeTons,
        int completedTradesCount,
        BigDecimal averageRealizedPricePerKg,
        BigDecimal localMandiBenchmarkAvgPricePerKg,
        BigDecimal kisanLinkPremiumIndexPercent,
        BigDecimal totalExtraProfitEarned,
        List<MonthlyEarningsData> monthlyEarnings
) {
}
