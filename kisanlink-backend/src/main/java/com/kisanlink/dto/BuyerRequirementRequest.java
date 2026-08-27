package com.kisanlink.dto;

import com.kisanlink.entity.CropCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BuyerRequirementRequest(
        Long cropId,
        String cropName,
        CropCategory category,
        @NotNull BigDecimal requiredQuantity,
        @NotBlank String qualityRequired,
        @NotNull BigDecimal offeredPrice,
        LocalDate validUntil,
        String location
) {
    public BuyerRequirementRequest(Long cropId, BigDecimal requiredQuantity, String qualityRequired,
                                   BigDecimal offeredPrice, LocalDate validUntil, String location) {
        this(cropId, null, null, requiredQuantity, qualityRequired, offeredPrice, validUntil, location);
    }
}

