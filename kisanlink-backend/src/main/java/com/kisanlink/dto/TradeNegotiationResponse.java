package com.kisanlink.dto;

import com.kisanlink.entity.Role;

import java.math.BigDecimal;
import java.time.Instant;

public record TradeNegotiationResponse(
        Long id,
        Role senderRole,
        String senderName,
        BigDecimal proposedPricePerKg,
        BigDecimal proposedQuantity,
        String message,
        Instant createdAt
) {
}
