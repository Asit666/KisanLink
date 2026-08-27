package com.kisanlink.dto;

import java.math.BigDecimal;

/**
 * Labeled confidence interval representing estimated price bounds at a specific certainty level.
 */
public record ConfidenceInterval(
        String label,
        Double confidenceLevel,
        BigDecimal lowerBound,
        BigDecimal upperBound
) {
}
