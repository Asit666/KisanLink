package com.kisanlink.controller;

import com.kisanlink.dto.EscrowResponse;
import com.kisanlink.service.EscrowService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/webhooks")
public class PaymentWebhookController {

    private static final Logger log = LoggerFactory.getLogger(PaymentWebhookController.class);
    private static final String HMAC_SHA256 = "HmacSHA256";

    private final EscrowService escrowService;
    private final Set<String> processedPayments = Collections.newSetFromMap(new ConcurrentHashMap<>());

    @Value("${kisanlink.payment.webhook-secret:dev-webhook-secret-token}")
    private String webhookSecret;

    @Value("${spring.profiles.active:}")
    private String activeProfile;

    public PaymentWebhookController(EscrowService escrowService) {
        this.escrowService = escrowService;
    }

    public record PaymentWebhookPayload(
            String event,
            Long escrowId,
            Long tradeId,
            BigDecimal amount,
            String paymentId,
            String gateway,
            String status
    ) {}

    public record WebhookAck(
            boolean success,
            String message,
            String paymentId
    ) {}

    @PostMapping("/payment")
    public ResponseEntity<WebhookAck> handlePaymentWebhook(
            @RequestBody PaymentWebhookPayload payload,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String razorpaySignature) {

        log.info("Received payment gateway webhook event: {} for escrow #{}", payload.event(), payload.escrowId());

        String effectiveSignature = signature != null ? signature : razorpaySignature;
        boolean isProduction = "prod".equalsIgnoreCase(activeProfile) || "production".equalsIgnoreCase(activeProfile);

        if (isProduction) {
            if (effectiveSignature == null || effectiveSignature.isBlank()) {
                log.warn("Missing required webhook signature in production mode.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new WebhookAck(false, "Missing webhook signature", payload.paymentId()));
            }

            String expectedSignature = calculateHmacSha256(payload.paymentId() + "|" + payload.amount(), webhookSecret);
            if (!effectiveSignature.equalsIgnoreCase(expectedSignature)) {
                log.warn("Invalid webhook signature for payment: {}", payload.paymentId());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new WebhookAck(false, "Invalid cryptographic signature", payload.paymentId()));
            }
        }

        if (payload.paymentId() != null && !processedPayments.add(payload.paymentId())) {
            log.info("Duplicate webhook delivery skipped for payment ID: {}", payload.paymentId());
            return ResponseEntity.ok(new WebhookAck(true, "Duplicate webhook acknowledged (idempotent)", payload.paymentId()));
        }

        if ("PAYMENT_SUCCESS".equalsIgnoreCase(payload.event()) || "order.paid".equalsIgnoreCase(payload.event())) {
            try {
                EscrowResponse response = escrowService.processVerifiedPaymentWebhook(
                        payload.escrowId(),
                        payload.amount(),
                        payload.paymentId(),
                        payload.gateway() != null ? payload.gateway() : "UPI_PAYMENT_GATEWAY"
                );
                return ResponseEntity.ok(new WebhookAck(true, "Escrow funded via verified gateway webhook", payload.paymentId()));
            } catch (Exception e) {
                log.error("Failed to process payment webhook for escrow #{}: {}", payload.escrowId(), e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new WebhookAck(false, "Webhook processing error: " + e.getMessage(), payload.paymentId()));
            }
        }

        return ResponseEntity.ok(new WebhookAck(true, "Ignored unhandled webhook event: " + payload.event(), payload.paymentId()));
    }

    private String calculateHmacSha256(String data, String secret) {
        try {
            Mac sha256Hmac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            sha256Hmac.init(secretKey);
            byte[] hash = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("HMAC computation failure: {}", e.getMessage());
            return "";
        }
    }
}
