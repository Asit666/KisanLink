package com.kisanlink.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record VerifyPickupRequest(
        @NotBlank(message = "Pickup verification code is required")
        String pickupCode,
        @NotNull(message = "Loaded quantity in kg is required")
        BigDecimal quantityLoadedKg,
        String pickupNotes
) {}
