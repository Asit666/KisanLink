package com.kisanlink.controller;

import com.kisanlink.dto.RecommendationRequest;
import com.kisanlink.dto.RecommendationResponse;
import com.kisanlink.entity.Recommendation;
import com.kisanlink.service.RecommendationService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
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
    public RecommendationResponse recommend(@Valid @RequestBody RecommendationRequest request,
                                            @AuthenticationPrincipal UserDetails principal) {
        String email = principal != null ? principal.getUsername() : null;
        return recommendationService.recommend(request, email);
    }

    @GetMapping("/farmer/{farmerId}")
    public List<Recommendation> history(@PathVariable Long farmerId,
                                        @AuthenticationPrincipal UserDetails principal) {
        String email = principal != null ? principal.getUsername() : null;
        return recommendationService.history(farmerId, email);
    }
}

