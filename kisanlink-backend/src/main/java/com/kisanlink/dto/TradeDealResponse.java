package com.kisanlink.dto;

import com.kisanlink.entity.Role;
import com.kisanlink.entity.TradeStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record TradeDealResponse(
        Long id,
        Long farmerId,
        String farmerName,
        String farmerDistrict,
        Long buyerId,
        String buyerName,
        String buyerType,
        Long cropId,
        String cropName,
        String cropCategory,
        Long produceId,
        String produceImageUrl,
        Long requirementId,
        BigDecimal quantity,
        BigDecimal agreedPricePerKg,
        BigDecimal transportCost,
        BigDecimal totalAmount,
        BigDecimal netFarmerReturn,
        TradeStatus status,
        Role initiatedBy,
        String deliveryAddress,
        String notes,
        List<TradeNegotiationResponse> negotiations,
        Instant createdAt,
        Instant updatedAt
) {
}
