package com.kisanlink.dto;

import jakarta.validation.constraints.NotNull;

public record StartConversationRequest(
        @NotNull Long farmerId,
        @NotNull Long buyerId,
        String cropName,
        Long tradeDealId
) {}
