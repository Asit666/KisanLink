package com.kisanlink.controller;

import com.kisanlink.dto.WeatherAdvisoryResponse;
import com.kisanlink.service.WeatherAdvisoryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/weather")
public class WeatherController {

    private final WeatherAdvisoryService weatherAdvisoryService;

    public WeatherController(WeatherAdvisoryService weatherAdvisoryService) {
        this.weatherAdvisoryService = weatherAdvisoryService;
    }

    @GetMapping("/advisory")
    public WeatherAdvisoryResponse getAdvisory(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) Long cropId,
            @RequestParam(required = false) String locationName) {
        return weatherAdvisoryService.getAdvisory(latitude, longitude, cropId, locationName);
    }
}
