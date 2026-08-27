package com.kisanlink.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CounterOfferRequest(
        @NotNull @Positive BigDecimal proposedPricePerKg,
        @NotNull @Positive BigDecimal proposedQuantity,
        String message
) {
}
