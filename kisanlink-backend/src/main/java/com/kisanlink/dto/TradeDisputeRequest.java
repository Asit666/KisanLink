package com.kisanlink.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record TradeDisputeRequest(
        @NotNull(message = "Trade deal ID is required")
        Long tradeDealId,

        @NotBlank(message = "Dispute type is required")
        String disputeType,

        @NotBlank(message = "Description is required")
        String description,

        BigDecimal claimAmount
) {}
