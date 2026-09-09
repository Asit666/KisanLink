package com.kisanlink.dto;

import com.kisanlink.entity.CropCategory;

import java.math.BigDecimal;

public record CropPriceSummaryDTO(
        Long cropId,
        String cropName,
        CropCategory category,
        String unit,
        BigDecimal latestModalPrice,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        String trend,
        BigDecimal changePercent,
        BigDecimal mspPrice,
        Long activeListingsCount
) {
}
