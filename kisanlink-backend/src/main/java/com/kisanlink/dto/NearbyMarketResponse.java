package com.kisanlink.dto;

import com.kisanlink.entity.MarketType;
import java.math.BigDecimal;

/**
 * Detailed representation of a nearby agricultural market/mandi
 * with geographical distance, estimated transport freight cost,
 * estimated travel duration, cardinal direction, and navigation routing.
 */
public record NearbyMarketResponse(
        Long id,
        String name,
        String address,
        String district,
        String state,
        Double latitude,
        Double longitude,
        MarketType marketType,
        BigDecimal distanceKm,
        BigDecimal estimatedTransportCost,
        Integer estimatedDurationMinutes,
        String direction,
        String routeSummary,
        String navigationUrl
) {
}
