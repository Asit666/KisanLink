package com.kisanlink.dto;

import com.kisanlink.entity.VehicleType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record TransporterVehicleRequest(
        @NotNull(message = "Vehicle type is required")
        VehicleType vehicleType,

        @NotBlank(message = "Registration number is required")
        String vehicleNumber,

        @NotNull(message = "Capacity is required")
        @DecimalMin(value = "50", message = "Capacity must be at least 50 kg")
        BigDecimal capacityKg,

        @NotNull(message = "Rate per km is required")
        @DecimalMin(value = "1", message = "Rate must be at least 1 INR/km")
        BigDecimal ratePerKm,

        @NotNull(message = "Base charge is required")
        BigDecimal baseCharge,

        Boolean active,
        String status
) {}
