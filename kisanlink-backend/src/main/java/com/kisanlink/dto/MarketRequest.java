package com.kisanlink.dto;

import com.kisanlink.entity.MarketType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MarketRequest(
        @NotBlank String name,
        String address,
        String district,
        String state,
        Double latitude,
        Double longitude,
        @NotNull MarketType marketType
) {
}
