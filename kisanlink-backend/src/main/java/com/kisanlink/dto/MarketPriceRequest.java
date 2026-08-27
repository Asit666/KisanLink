package com.kisanlink.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MarketPriceRequest(
        @NotNull Long marketId,
        @NotNull Long cropId,
        @NotNull LocalDate date,
        @NotNull BigDecimal minPrice,
        @NotNull BigDecimal maxPrice,
        @NotNull BigDecimal modalPrice,
        String source
) {
}
