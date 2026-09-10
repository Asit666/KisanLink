package com.kisanlink.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kisanlink.dto.InboundSmsWebhookRequest;
import com.kisanlink.dto.SmsAlertRequest;
import com.kisanlink.dto.SmsAlertResponse;
import com.kisanlink.entity.*;
import com.kisanlink.repository.SmsWhatsAppLogRepository;
import com.kisanlink.repository.TradeDealRepository;
import com.kisanlink.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class SmsWhatsAppService {

    private final SmsWhatsAppLogRepository logRepository;
    private final UserRepository userRepository;
    private final TradeDealRepository tradeDealRepository;
    private final NotificationWebSocketService notificationWebSocketService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient;

    @org.springframework.beans.factory.annotation.Value("${kisanlink.sms.mode:simulated}")
    private String smsMode;

    @org.springframework.beans.factory.annotation.Value("${kisanlink.sms.msg91.auth-key:}")
    private String msg91AuthKey;

    @org.springframework.beans.factory.annotation.Value("${kisanlink.sms.msg91.template-id:}")
    private String msg91TemplateId;

    @org.springframework.beans.factory.annotation.Value("${kisanlink.sms.msg91.sender-id:}")
    private String msg91SenderId;

    public SmsWhatsAppService(SmsWhatsAppLogRepository logRepository,
                              UserRepository userRepository,
                              TradeDealRepository tradeDealRepository,
                              NotificationWebSocketService notificationWebSocketService) {
        this.logRepository = logRepository;
        this.userRepository = userRepository;
        this.tradeDealRepository = tradeDealRepository;
        this.notificationWebSocketService = notificationWebSocketService;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public interface NotificationGatewayProvider {
        GatewayResult dispatch(String recipientPhone, MessageChannel channel, String text);
    }

    public record GatewayResult(String providerMessageId, MessageStatus status, boolean isSimulated) {}

    private NotificationGatewayProvider gatewayProvider = (recipientPhone, channel, text) -> {
        String prefix = channel == MessageChannel.WHATSAPP ? "WA-SIM-" : "SM-SIM-";
        String providerId = prefix + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        return new GatewayResult(providerId, MessageStatus.DELIVERED, true);
    };

    public void setGatewayProvider(NotificationGatewayProvider provider) {
        if (provider != null) {
            this.gatewayProvider = provider;
        }
    }

    public SmsAlertResponse dispatchAlert(User user, String recipientPhone, MessageChannel channel, String messageType, String text) {
        String phone = (recipientPhone != null && !recipientPhone.isBlank())
                ? recipientPhone
                : (user != null && user.getPhone() != null ? user.getPhone() : "+91-9876543210");

        MessageChannel targetChannel = channel != null ? channel : MessageChannel.SMS;
        GatewayResult gatewayResult = isRealMode()
            ? dispatchThroughMsg91(phone, targetChannel, text)
            : gatewayProvider.dispatch(phone, targetChannel, text);

        SmsWhatsAppLog log = new SmsWhatsAppLog();
        log.setUser(user);
        log.setRecipientPhone(phone);
        log.setChannel(targetChannel);
        log.setMessageType(messageType != null ? messageType : "FIELD_ALERT");
        log.setBody(text);
        log.setProviderMessageId(gatewayResult.providerMessageId());
        log.setStatus(gatewayResult.status());
        log.setSentAt(Instant.now());

        SmsWhatsAppLog saved = logRepository.save(log);
        return mapToResponse(saved);
    }

    private boolean isRealMode() {
        return "real".equalsIgnoreCase(smsMode);
    }

    private GatewayResult dispatchThroughMsg91(String recipientPhone, MessageChannel channel, String text) {
        if (channel != MessageChannel.SMS) {
            throw new IllegalStateException("Real mode currently supports SMS only. Configure a WhatsApp provider separately.");
        }
        if (msg91AuthKey.isBlank() || msg91TemplateId.isBlank()) {
            throw new IllegalStateException("MSG91 is not configured. Set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID.");
        }

        try {
            Map<String, Object> recipient = new HashMap<>();
            recipient.put("mobiles", normalizeForMsg91(recipientPhone));
            recipient.put("VAR1", text);

            Map<String, Object> payload = new HashMap<>();
            payload.put("template_id", msg91TemplateId);
            payload.put("recipients", List.of(recipient));
            if (!msg91SenderId.isBlank()) {
                payload.put("sender", msg91SenderId);
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://control.msg91.com/api/v5/flow/"))
                    .timeout(Duration.ofSeconds(15))
                    .header("authkey", msg91AuthKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("MSG91 rejected the SMS request with HTTP " + response.statusCode());
            }

            JsonNode responseBody = objectMapper.readTree(response.body());
            String providerId = responseBody.path("request_id").asText("");
            if (providerId.isBlank()) {
                providerId = "MSG91-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
            }
            return new GatewayResult(providerId, MessageStatus.SENT, false);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("MSG91 SMS request was interrupted.", exception);
        } catch (Exception exception) {
            if (exception instanceof IllegalStateException illegalStateException) {
                throw illegalStateException;
            }
            throw new IllegalStateException("MSG91 SMS request failed.", exception);
        }
    }

    private String normalizeForMsg91(String phone) {
        String digits = phone.replaceAll("[^0-9]", "");
        return digits.startsWith("91") ? digits : "91" + digits;
    }

    public SmsAlertResponse handleInboundWebhook(InboundSmsWebhookRequest req) {
        String body = req.body() != null ? req.body().trim() : "";
        String phone = req.fromPhone() != null ? req.fromPhone().trim() : "+91-9876543210";

        String responseText;
        String messageType = "INBOUND_RESPONSE";

        if (body.toUpperCase().startsWith("ACCEPT")) {
            String[] parts = body.split("\\s+");
            if (parts.length >= 2) {
                try {
                    Long dealId = Long.parseLong(parts[1]);
                    TradeDeal deal = tradeDealRepository.findById(dealId).orElse(null);
                    if (deal != null) {
                        String fromNorm = normalizePhone(phone);
                        String farmerPhone = deal.getFarmer() != null && deal.getFarmer().getUser() != null ? normalizePhone(deal.getFarmer().getUser().getPhone()) : "";
                        String buyerPhone = deal.getBuyer() != null && deal.getBuyer().getUser() != null ? normalizePhone(deal.getBuyer().getUser().getPhone()) : "";

                        boolean matchesFarmer = !farmerPhone.isEmpty() && (fromNorm.endsWith(farmerPhone) || farmerPhone.endsWith(fromNorm));
                        boolean matchesBuyer = !buyerPhone.isEmpty() && (fromNorm.endsWith(buyerPhone) || buyerPhone.endsWith(fromNorm));

                        if (!matchesFarmer && !matchesBuyer) {
                            responseText = "KisanLink Security: Sender phone " + phone + " is not registered for Trade #" + dealId;
                            return dispatchAlert(null, phone, MessageChannel.SMS, messageType, responseText);
                        }

                        // Actor Turn Verification: The initiating party cannot accept their own proposal
                        if (deal.getInitiatedBy() == Role.FARMER && matchesFarmer && !matchesBuyer) {
                            responseText = "KisanLink Security: Farmer initiated Trade #" + dealId + ". Only the buyer can accept this offer.";
                            return dispatchAlert(null, phone, MessageChannel.SMS, messageType, responseText);
                        }
                        if (deal.getInitiatedBy() == Role.BUYER && matchesBuyer && !matchesFarmer) {
                            responseText = "KisanLink Security: Buyer initiated Trade #" + dealId + ". Only the farmer can accept this offer.";
                            return dispatchAlert(null, phone, MessageChannel.SMS, messageType, responseText);
                        }



                        if (deal.getStatus() == TradeStatus.PROPOSED || deal.getStatus() == TradeStatus.NEGOTIATING) {
                            deal.setStatus(TradeStatus.ACCEPTED);
                            tradeDealRepository.save(deal);
                            responseText = String.format("KisanLink: Trade #%d for %s accepted via SMS. Buyer has been notified to lock funds in Escrow.",
                                    dealId, deal.getCrop().getName());
                            notificationWebSocketService.sendTradeUpdate(deal.getFarmer().getUser(), deal, "Accepted via Field SMS");
                            notificationWebSocketService.sendTradeUpdate(deal.getBuyer().getUser(), deal, "Accepted via Farmer SMS");
                        } else {
                            responseText = "KisanLink: Trade #" + dealId + " is already active or in status: " + deal.getStatus();
                        }
                    } else {
                        responseText = "KisanLink: Trade #" + dealId + " not found.";
                    }
                } catch (NumberFormatException e) {
                    responseText = "KisanLink: Invalid Trade ID format. Send 'ACCEPT <deal_id>' to confirm.";
                }
            } else {
                responseText = "KisanLink: Please specify trade deal ID. Example: 'ACCEPT 4'.";
            }
        } else if (body.toUpperCase().startsWith("STATUS")) {
            responseText = "KisanLink Field Desk: All systems operational. 6 Jharkhand regional mandis live.";
        } else {
            responseText = "KisanLink: Received '" + body + "'. Send 'ACCEPT <id>' to accept deals, or visit kisanlink.app";
        }

        // Send simulated reply
        return dispatchAlert(null, phone, MessageChannel.SMS, messageType, responseText);
    }

    private String normalizePhone(String phone) {
        if (phone == null) return "";
        return phone.replaceAll("[^0-9]", "");
    }

    @Transactional(readOnly = true)
    public List<SmsAlertResponse> getRecentLogs(String userEmail) {
        if (userEmail != null) {
            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user != null) {
                return logRepository.findByUserIdOrderBySentAtDesc(user.getId())
                        .stream()
                        .map(this::mapToResponse)
                        .toList();
            }
        }
        return List.of();
    }


    public SmsAlertResponse sendTestAlert(SmsAlertRequest request, String userEmail) {
        User user = (userEmail != null) ? userRepository.findByEmail(userEmail).orElse(null) : null;
        String phone = request.recipientPhone() != null && !request.recipientPhone().isBlank()
                ? request.recipientPhone()
                : (user != null && user.getPhone() != null ? user.getPhone() : "+91-9876543210");

        return dispatchAlert(user, phone, request.channel(), request.messageType(), request.text());
    }

    private SmsAlertResponse mapToResponse(SmsWhatsAppLog l) {
        return new SmsAlertResponse(
                l.getId(),
                l.getUser() != null ? l.getUser().getId() : null,
                l.getRecipientPhone(),
                l.getChannel(),
                l.getMessageType(),
                l.getBody(),
                l.getProviderMessageId(),
                l.getStatus(),
                l.getSentAt()
        );
    }
}
