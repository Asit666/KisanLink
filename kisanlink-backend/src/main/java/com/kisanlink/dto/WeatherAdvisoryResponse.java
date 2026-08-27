package com.kisanlink.dto;

import java.time.Instant;
import java.util.List;

public record WeatherAdvisoryResponse(
        String locationName,
        Double latitude,
        Double longitude,
        Double currentTemp,
        String currentCondition,
        Integer humidityPercent,
        Double rainfallMm,
        Double windSpeedKmh,
        String harvestSuitability,
        String recommendedHarvestWindow,
        String spoilageRiskIndex,
        String transitAdvisory,
        List<String> cropAdvisories,
        List<WeatherDailyForecast> forecast,
        Instant generatedAt
) {
}
