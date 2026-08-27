package com.kisanlink.dto;

public record BuyerProfileRequest(
        String businessName,
        String businessType,
        String address,
        String district,
        String state,
        Double latitude,
        Double longitude
) {
}
