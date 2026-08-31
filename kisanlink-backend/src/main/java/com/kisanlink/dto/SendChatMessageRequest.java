package com.kisanlink.dto;

import jakarta.validation.constraints.NotBlank;

public record SendChatMessageRequest(
        @NotBlank String messageText
) {}
