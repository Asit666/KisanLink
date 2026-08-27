package com.kisanlink.dto;

public record FarmerProfileRequest(
        String address,
        String district,
        String state,
        Double latitude,
        Double longitude,
        String phone,
        String alertEmail
) {
    public FarmerProfileRequest(String address, String district, String state, Double latitude, Double longitude) {
        this(address, district, state, latitude, longitude, null, null);
    }
}

