package com.kisanlink.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

public record FarmerProfileRequest(
        String address,
        String district,
        String state,
        @Min(-90) @Max(90) Double latitude,
        @Min(-180) @Max(180) Double longitude,
        @Pattern(regexp = "^(\\+91)?[0-9]{10}$", message = "Phone must be a valid 10-digit number") String phone,
        @Email(message = "Alert email must be valid") String alertEmail
) {
    public FarmerProfileRequest(String address, String district, String state, Double latitude, Double longitude) {
        this(address, district, state, latitude, longitude, null, null);
    }
}


