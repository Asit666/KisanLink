package com.kisanlink.controller;

import com.kisanlink.dto.FarmerAnalyticsResponse;
import com.kisanlink.service.FarmerAnalyticsService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class FarmerAnalyticsController {

    private final FarmerAnalyticsService farmerAnalyticsService;

    public FarmerAnalyticsController(FarmerAnalyticsService farmerAnalyticsService) {
        this.farmerAnalyticsService = farmerAnalyticsService;
    }

    @GetMapping("/farmer/{farmerId}")
    public FarmerAnalyticsResponse getFarmerAnalytics(@PathVariable Long farmerId,
                                                      @AuthenticationPrincipal UserDetails principal) {
        return farmerAnalyticsService.getFarmerAnalytics(farmerId, principal.getUsername());
    }
}
