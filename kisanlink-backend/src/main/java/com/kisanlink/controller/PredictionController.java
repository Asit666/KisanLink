package com.kisanlink.controller;

import com.kisanlink.dto.PredictionResponse;
import com.kisanlink.entity.PricePrediction;
import com.kisanlink.service.PredictionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/predictions")
public class PredictionController {
    private final PredictionService predictionService;

    public PredictionController(PredictionService predictionService) {
        this.predictionService = predictionService;
    }

    @GetMapping("/{cropId}")
    public List<PricePrediction> findByCrop(@PathVariable Long cropId) {
        return predictionService.findByCrop(cropId);
    }

    @GetMapping("/{cropId}/{marketId}")
    public List<PricePrediction> findByCropAndMarket(@PathVariable Long cropId, @PathVariable Long marketId) {
        return predictionService.findByCropAndMarket(cropId, marketId);
    }

    @GetMapping("/{cropId}/estimate")
    public PredictionResponse getEstimate(@PathVariable Long cropId) {
        return predictionService.estimate(cropId);
    }

    @GetMapping("/{cropId}/forecast")
    public PredictionResponse getForecast(@PathVariable Long cropId,
                                          @RequestParam(defaultValue = "7") int days) {
        return predictionService.forecast(cropId, days);
    }

    @PostMapping("/{cropId}/estimate")
    public PredictionResponse estimate(@PathVariable Long cropId) {
        return predictionService.estimate(cropId);
    }
}
