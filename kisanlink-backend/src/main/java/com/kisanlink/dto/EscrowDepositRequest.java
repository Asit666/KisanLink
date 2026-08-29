package com.kisanlink.dto;

import com.kisanlink.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record EscrowDepositRequest(
        @NotNull @Positive BigDecimal amount,
        PaymentMethod paymentMethod,
        String buyerUpiId,
        String upiTransactionRef
) {}

