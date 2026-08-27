package com.kisanlink.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BuyerRequirementRequest(
        @NotNull Long cropId,
        @NotNull BigDecimal requiredQuantity,
        @NotBlank String qualityRequired,
        @NotNull BigDecimal offeredPrice,
        LocalDate validUntil,
        String location
) {
}
