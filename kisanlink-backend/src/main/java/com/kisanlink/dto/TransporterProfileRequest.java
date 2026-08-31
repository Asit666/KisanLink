package com.kisanlink.dto;

import com.kisanlink.entity.VehicleType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record TransporterProfileRequest(
        @NotNull VehicleType vehicleType,
        String vehicleNumber,
        @NotNull @DecimalMin("100") BigDecimal capacityKg,
        String baseDistrict,
        String baseState,
        Double baseLatitude,
        Double baseLongitude,
        @DecimalMin("1") BigDecimal ratePerKm,
        @DecimalMin("0") BigDecimal baseCharge,
        String alertPhone,
        boolean available
) {}
