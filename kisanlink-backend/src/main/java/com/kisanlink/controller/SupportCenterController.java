package com.kisanlink.controller;

import com.kisanlink.dto.SupportCenterResponse;
import com.kisanlink.entity.SupportCenter;
import com.kisanlink.repository.SupportCenterRepository;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/support")
public class SupportCenterController {

    private final SupportCenterRepository supportCenterRepository;

    public SupportCenterController(SupportCenterRepository supportCenterRepository) {
        this.supportCenterRepository = supportCenterRepository;
    }

    @GetMapping("/nearby")
    public List<SupportCenterResponse> getNearbyCenters(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String district,
            @RequestParam(required = false, defaultValue = "500") Double radiusKm) {

        double userLat = latitude != null ? latitude : 20.0384;
        double userLng = longitude != null ? longitude : 73.8052;

        List<SupportCenter> centers;
        if (type != null && !type.isBlank() && !"ALL".equalsIgnoreCase(type)) {
            centers = supportCenterRepository.findByCenterType(type.toUpperCase());
        } else if (district != null && !district.isBlank()) {
            centers = supportCenterRepository.findByDistrictIgnoreCase(district);
        } else {
            centers = supportCenterRepository.findAll();
        }

        return centers.stream()
                .map(c -> {
                    double dist = calculateHaversineDistance(userLat, userLng, c.getLatitude(), c.getLongitude());
                    return mapToResponse(c, dist);
                })
                .filter(c -> c.distanceKm() <= radiusKm || "HELPLINE".equalsIgnoreCase(c.type()))
                .sorted(Comparator.comparingDouble(SupportCenterResponse::distanceKm))
                .collect(Collectors.toList());
    }

    private SupportCenterResponse mapToResponse(SupportCenter c, double distanceKm) {
        List<String> serviceList = c.getServices() != null
                ? Arrays.stream(c.getServices().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList())
                : Collections.emptyList();

        return new SupportCenterResponse(
                c.getId(),
                c.getName(),
                c.getCenterType(),
                c.getBadge(),
                c.getDesignation(),
                c.getDepartment(),
                c.getDistrict(),
                c.getState(),
                c.getAddress(),
                c.getLatitude(),
                c.getLongitude(),
                Math.round(distanceKm * 10.0) / 10.0,
                c.getRating() != null ? c.getRating() : "4.8",
                c.getPhone(),
                c.getTollFree(),
                c.getOperatingHours() != null ? c.getOperatingHours() : "Mon - Sat: 09:30 AM - 05:30 PM",
                serviceList,
                c.getInCharge(),
                c.getVerified(),
                "ACTIVE_NOW"
        );
    }

    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double latDist = Math.toRadians(lat2 - lat1);
        double lonDist = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDist / 2) * Math.sin(latDist / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDist / 2) * Math.sin(lonDist / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
