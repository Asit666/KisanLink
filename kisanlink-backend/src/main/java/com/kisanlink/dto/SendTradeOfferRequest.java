package com.kisanlink.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record SendTradeOfferRequest(
        @NotBlank String cropName,
        @NotNull @DecimalMin("1") BigDecimal quantityKg,
        @NotNull @DecimalMin("1") BigDecimal pricePerKg,
        String note
) {}
