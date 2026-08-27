package com.kisanlink.dto;

public record BuyerProfileRequest(
        String businessName,
        String businessType,
        String address,
        String district,
        String state,
        Double latitude,
        Double longitude,
        String phone,
        String alertEmail
) {
    public BuyerProfileRequest(String businessName, String businessType, String address, String district, String state, Double latitude, Double longitude) {
        this(businessName, businessType, address, district, state, latitude, longitude, null, null);
    }
}

