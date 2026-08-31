package com.kisanlink.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record RespondOfferRequest(
        @NotBlank String action, // ACCEPT, COUNTER, REJECT
        BigDecimal counterPricePerKg,
        BigDecimal counterQuantityKg,
        String counterNote
) {}
