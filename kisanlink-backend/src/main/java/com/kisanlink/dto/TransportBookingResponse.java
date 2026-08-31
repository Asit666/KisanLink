package com.kisanlink.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record TransportBookingResponse(
        Long bookingId,
        Long dealId,
        String status,

        // Transporter info
        Long transporterId,
        String transporterName,
        String transporterPhone,
        String vehicleType,
        String vehicleNumber,
        BigDecimal capacityKg,
        boolean transporterVerified,

        // Pricing
        BigDecimal distanceKm,
        BigDecimal estimatedCost,
        BigDecimal ratePerKm,
        BigDecimal baseCharge,

        // Logistics
        String pickupAddress,
        String deliveryAddress,
        LocalDate scheduledDate,
        String notes,

        // Timestamps
        Instant confirmedAt,
        Instant deliveredAt,
        Instant createdAt
) {}
