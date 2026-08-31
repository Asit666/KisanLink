package com.kisanlink.dto;

import java.math.BigDecimal;

/**
 * Ranked transporter suggestion returned by the matching engine with reliability metrics,
 * perishability-aware scoring, ETA, and farmer bookmark status.
 */
public record TransportSuggestionResponse(
        Long transporterId,
        String transporterName,
        String transporterPhone,
        String vehicleType,
        String vehicleNumber,
        BigDecimal capacityKg,
        boolean verified,
        boolean available,
        String baseDistrict,
        String baseState,

        /** Km from this transporter's base to the farmer pickup point */
        double distanceFromFarmKm,

        /** Km from farmer pickup -> buyer delivery (route length) */
        double routeKm,

        BigDecimal ratePerKm,
        BigDecimal baseCharge,

        /** Total estimated transport cost = baseCharge + (ratePerKm * routeKm) */
        BigDecimal estimatedCost,

        /** 0-100 composite score (higher = better match) */
        double score,

        // Reliability metrics
        int completedTrips,
        double rating,
        double onTimeRate,
        double reliabilityScore,
        String tierBadge,

        // Smart logistics additions
        int etaMinutes,
        String perishabilityTier,
        boolean favorite
) {}
