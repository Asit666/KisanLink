package com.kisanlink.controller;

import com.kisanlink.dto.RecommendationRequest;
import com.kisanlink.dto.RecommendationResponse;
import com.kisanlink.entity.Recommendation;
import com.kisanlink.service.RecommendationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {
    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @PostMapping
    public RecommendationResponse recommend(@Valid @RequestBody RecommendationRequest request) {
        return recommendationService.recommend(request);
    }

    @GetMapping("/farmer/{farmerId}")
    public List<Recommendation> history(@PathVariable Long farmerId) {
        return recommendationService.history(farmerId);
    }
}
