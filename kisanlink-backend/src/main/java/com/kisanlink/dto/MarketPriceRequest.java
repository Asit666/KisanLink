package com.kisanlink.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MarketPriceRequest(
                @NotNull Long marketId,
                @NotNull Long cropId,
                @NotNull @PastOrPresent LocalDate date,
                @NotNull @Positive BigDecimal minPrice,
                @NotNull @Positive BigDecimal maxPrice,
                @NotNull @Positive BigDecimal modalPrice,
                String source) {
}

