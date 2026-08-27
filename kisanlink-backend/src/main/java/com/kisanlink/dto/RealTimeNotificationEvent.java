package com.kisanlink.dto;

import java.time.Instant;

public record RealTimeNotificationEvent(
        String eventType,
        String title,
        String message,
        Long relatedId,
        Object payload,
        Instant timestamp
) {}
