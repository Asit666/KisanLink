package com.kisanlink.dto;

public record FarmerProfileRequest(
        String address,
        String district,
        String state,
        Double latitude,
        Double longitude
) {
}
