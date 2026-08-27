package com.kisanlink.dto;

import java.math.BigDecimal;
import java.util.List;

public record RecommendationResponse(
        String crop,
        BigDecimal quantity,
        RecommendationOption recommendedBuyer,
        List<String> reason,
        List<RecommendationOption> alternatives
) {
}
