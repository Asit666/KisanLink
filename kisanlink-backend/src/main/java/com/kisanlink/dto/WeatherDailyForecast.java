package com.kisanlink.dto;

import java.time.LocalDate;

public record WeatherDailyForecast(
        LocalDate date,
        String dayName,
        Double tempMax,
        Double tempMin,
        Integer precipitationProbability,
        String condition,
        Integer humidityPercent,
        Double windSpeedKmh,
        String advisory
) {
}
