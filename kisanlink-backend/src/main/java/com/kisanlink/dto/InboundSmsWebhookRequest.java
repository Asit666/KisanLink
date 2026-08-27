package com.kisanlink.dto;

public record InboundSmsWebhookRequest(
        String fromPhone,
        String body,
        String messageSid
) {}
