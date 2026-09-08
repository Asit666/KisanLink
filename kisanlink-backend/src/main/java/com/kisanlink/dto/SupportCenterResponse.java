package com.kisanlink.dto;

import java.util.List;

public record SupportCenterResponse(
        Long id,
        String name,
        String type,
        String badge,
        String designation,
        String department,
        String district,
        String state,
        String location,
        Double lat,
        Double lng,
        Double distanceKm,
        String rating,
        String phone,
        String tollFree,
        String hours,
        List<String> services,
        String inCharge,
        Boolean verified,
        String status
) {}
