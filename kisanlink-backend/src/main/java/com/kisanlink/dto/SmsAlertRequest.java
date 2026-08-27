package com.kisanlink.dto;

import com.kisanlink.entity.MessageChannel;
import jakarta.validation.constraints.NotBlank;

public record SmsAlertRequest(
        String recipientPhone,
        MessageChannel channel,
        String messageType,
        @NotBlank String text
) {}
