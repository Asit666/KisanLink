package com.kisanlink.dto;

import com.kisanlink.entity.MessageChannel;
import com.kisanlink.entity.MessageStatus;

import java.time.Instant;

public record SmsAlertResponse(
        Long id,
        Long userId,
        String recipientPhone,
        MessageChannel channel,
        String messageType,
        String body,
        String providerMessageId,
        MessageStatus status,
        Instant sentAt
) {}
