package com.kisanlink.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CropProduceResponse(
        Long id,
        Long farmerId,
        String farmerName,
        String villageOrDistrict,
        String state,
        Long cropId,
        String cropName,
        BigDecimal quantity,
        String unit,
        String quality,
        BigDecimal expectedPrice,
        LocalDate harvestDate,
        LocalDate availableUntil,
        String description,
        String imageUrl
) {
}
