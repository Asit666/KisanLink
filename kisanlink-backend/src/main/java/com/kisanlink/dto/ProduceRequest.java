package com.kisanlink.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProduceRequest(
        @NotNull Long cropId,
        @NotNull BigDecimal quantity,
        @NotBlank String quality,
        LocalDate harvestDate,
        LocalDate availableUntil,
        BigDecimal expectedPrice
) {
}
