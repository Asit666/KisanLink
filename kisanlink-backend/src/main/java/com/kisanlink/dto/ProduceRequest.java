package com.kisanlink.dto;

import com.kisanlink.entity.CropCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProduceRequest(
        Long cropId,
        String cropName,
        CropCategory category,
        @NotNull BigDecimal quantity,
        @NotBlank String quality,
        LocalDate harvestDate,
        LocalDate availableUntil,
        BigDecimal expectedPrice,
        String imageUrl,
        String description
) {
    public ProduceRequest(Long cropId, BigDecimal quantity, String quality,
                          LocalDate harvestDate, LocalDate availableUntil, BigDecimal expectedPrice) {
        this(cropId, null, null, quantity, quality, harvestDate, availableUntil, expectedPrice, null, null);
    }
}

