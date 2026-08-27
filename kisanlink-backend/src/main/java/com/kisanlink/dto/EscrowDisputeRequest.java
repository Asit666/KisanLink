package com.kisanlink.dto;

import jakarta.validation.constraints.NotBlank;

public record EscrowDisputeRequest(
        @NotBlank String reason
) {}
