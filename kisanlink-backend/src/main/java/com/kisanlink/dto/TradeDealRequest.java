package com.kisanlink.dto;

import com.kisanlink.entity.TradeStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record TradeDealRequest(
        @NotNull Long farmerId,
        @NotNull Long buyerId,
        Long produceId,
        Long requirementId,
        Long cropId,
        @NotNull @Positive BigDecimal quantity,
        @NotNull @Positive BigDecimal agreedPricePerKg,
        @PositiveOrZero BigDecimal transportCost,
        TradeStatus status,
        String deliveryAddress,
        String notes
) {
}

