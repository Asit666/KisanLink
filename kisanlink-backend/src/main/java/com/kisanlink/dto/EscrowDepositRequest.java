package com.kisanlink.dto;

import com.kisanlink.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record EscrowDepositRequest(
        @NotNull BigDecimal amount,
        PaymentMethod paymentMethod,
        String buyerUpiId,
        String upiTransactionRef
) {}
