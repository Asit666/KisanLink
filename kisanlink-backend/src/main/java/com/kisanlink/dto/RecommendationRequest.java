package com.kisanlink.dto;

import jakarta.validation.constraints.NotNull;

public record RecommendationRequest(@NotNull Long farmerId, @NotNull Long produceId) {
}
