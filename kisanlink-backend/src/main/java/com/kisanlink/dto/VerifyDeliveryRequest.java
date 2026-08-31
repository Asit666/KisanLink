package com.kisanlink.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record VerifyDeliveryRequest(
        @NotBlank(message = "Delivery verification code is required")
        String deliveryCode,
        @NotNull(message = "Delivered quantity in kg is required")
        BigDecimal deliveredQuantityKg,
        String deliveryNotes
) {}
