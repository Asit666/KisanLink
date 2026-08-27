package com.kisanlink.controller;

import com.kisanlink.dto.InboundSmsWebhookRequest;
import com.kisanlink.dto.SmsAlertRequest;
import com.kisanlink.dto.SmsAlertResponse;
import com.kisanlink.service.SmsWhatsAppService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/notifications/sms-whatsapp")
public class SmsWhatsAppController {

    private final SmsWhatsAppService smsWhatsAppService;

    @Value("${kisanlink.webhook.secret:}")
    private String webhookSecret;

    public SmsWhatsAppController(SmsWhatsAppService smsWhatsAppService) {
        this.smsWhatsAppService = smsWhatsAppService;
    }

    @GetMapping
    public List<SmsAlertResponse> getLogs(@AuthenticationPrincipal UserDetails principal) {
        String email = principal != null ? principal.getUsername() : null;
        return smsWhatsAppService.getRecentLogs(email);
    }

    @PostMapping("/test-send")
    public SmsAlertResponse sendTestAlert(@Valid @RequestBody SmsAlertRequest request,
                                          @AuthenticationPrincipal UserDetails principal) {
        String email = principal != null ? principal.getUsername() : null;
        return smsWhatsAppService.sendTestAlert(request, email);
    }

    @PostMapping("/webhook")
    public SmsAlertResponse handleWebhook(
            @RequestBody InboundSmsWebhookRequest request,
            @RequestHeader(value = "X-Webhook-Secret", required = false) String secretHeader) {
        // Enforce secret header if configured in production
        if (webhookSecret != null && !webhookSecret.isBlank()) {
            if (secretHeader == null || !webhookSecret.equals(secretHeader)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or missing webhook signature/secret");
            }
        }
        return smsWhatsAppService.handleInboundWebhook(request);
    }
}

