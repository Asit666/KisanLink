package com.kisanlink.dto;

import com.kisanlink.entity.EscrowStatus;
import com.kisanlink.entity.PaymentMethod;

import java.math.BigDecimal;
import java.time.Instant;

public record EscrowResponse(
        Long id,
        Long tradeDealId,
        BigDecimal totalAmount,
        BigDecimal depositAmount,
        BigDecimal farmerPayout,
        EscrowStatus status,
        PaymentMethod paymentMethod,
        String upiRef,
        String farmerUpiId,
        String buyerUpiId,
        String settlementUtr,
        String disputeReason,
        Instant depositedAt,
        Instant releasedAt,
        Instant createdAt,
        Instant updatedAt
) {}
