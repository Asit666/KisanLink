package com.kisanlink.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BuyerRequirementResponse(
        Long id,
        Long buyerId,
        String buyerName,
        String businessName,
        Long cropId,
        String cropName,
        BigDecimal requiredQuantity,
        String qualityRequired,
        BigDecimal offeredPrice,
        String location,
        LocalDate validUntil
) {
}
