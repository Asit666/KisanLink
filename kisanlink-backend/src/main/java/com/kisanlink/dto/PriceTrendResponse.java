package com.kisanlink.dto;

import java.math.BigDecimal;

public record PriceTrendResponse(String trend, BigDecimal latestPrice, BigDecimal changePercent) {
}
