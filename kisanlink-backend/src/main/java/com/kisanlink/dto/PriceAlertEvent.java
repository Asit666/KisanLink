package com.kisanlink.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record PriceAlertEvent(
        String cropName,
        String marketName,
        BigDecimal newPrice,
        BigDecimal previousPrice,
        BigDecimal changePercent,
        String trend,
        Instant timestamp
) {}
