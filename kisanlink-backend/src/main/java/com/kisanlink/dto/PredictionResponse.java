package com.kisanlink.dto;

import com.kisanlink.entity.PriceTrend;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PredictionResponse(LocalDate date, BigDecimal estimatedPrice,
                                 BigDecimal lowerBound, BigDecimal upperBound,
                                 PriceTrend trend, String disclaimer) {
}
