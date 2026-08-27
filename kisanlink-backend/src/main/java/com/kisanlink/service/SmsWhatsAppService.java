package com.kisanlink.service;

import com.kisanlink.dto.InboundSmsWebhookRequest;
import com.kisanlink.dto.SmsAlertRequest;
import com.kisanlink.dto.SmsAlertResponse;
import com.kisanlink.entity.*;
import com.kisanlink.repository.SmsWhatsAppLogRepository;
import com.kisanlink.repository.TradeDealRepository;
import com.kisanlink.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class SmsWhatsAppService {

    private final SmsWhatsAppLogRepository logRepository;
    private final UserRepository userRepository;
    private final TradeDealRepository tradeDealRepository;
    private final NotificationWebSocketService notificationWebSocketService;

    public SmsWhatsAppService(SmsWhatsAppLogRepository logRepository,
                              UserRepository userRepository,
                              TradeDealRepository tradeDealRepository,
                              NotificationWebSocketService notificationWebSocketService) {
        this.logRepository = logRepository;
        this.userRepository = userRepository;
        this.tradeDealRepository = tradeDealRepository;
        this.notificationWebSocketService = notificationWebSocketService;
    }

    public SmsAlertResponse dispatchAlert(User user, String recipientPhone, MessageChannel channel, String messageType, String text) {
        String phone = (recipientPhone != null && !recipientPhone.isBlank())
                ? recipientPhone
                : (user != null && user.getPhone() != null ? user.getPhone() : "+91-9876543210");

        MessageChannel targetChannel = channel != null ? channel : MessageChannel.SMS;
        String prefix = targetChannel == MessageChannel.WHATSAPP ? "WA-" : "SM-";
        String providerId = prefix + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();

        SmsWhatsAppLog log = new SmsWhatsAppLog();
        log.setUser(user);
        log.setRecipientPhone(phone);
        log.setChannel(targetChannel);
        log.setMessageType(messageType != null ? messageType : "FIELD_ALERT");
        log.setBody(text);
        log.setProviderMessageId(providerId);
        log.setStatus(MessageStatus.DELIVERED);
        log.setSentAt(Instant.now());

        SmsWhatsAppLog saved = logRepository.save(log);
        return mapToResponse(saved);
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
                    if (deal != null && (deal.getStatus() == TradeStatus.PROPOSED || deal.getStatus() == TradeStatus.NEGOTIATING)) {
                        deal.setStatus(TradeStatus.ACCEPTED);
                        tradeDealRepository.save(deal);
                        responseText = String.format("KisanLink: Trade #%d for %s accepted via SMS. Buyer has been notified to lock funds in Escrow.",
                                dealId, deal.getCrop().getName());
                        notificationWebSocketService.sendTradeUpdate(deal.getFarmer().getUser(), deal, "Accepted via Field SMS");
                        notificationWebSocketService.sendTradeUpdate(deal.getBuyer().getUser(), deal, "Accepted via Farmer SMS");
                    } else {
                        responseText = "KisanLink: Trade #" + dealId + " is already active or not found.";
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

    @Transactional(readOnly = true)
    public List<SmsAlertResponse> getRecentLogs(String userEmail) {
        if (userEmail != null) {
            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user != null) {
                List<SmsWhatsAppLog> userLogs = logRepository.findByUserIdOrderBySentAtDesc(user.getId());
                if (!userLogs.isEmpty()) {
                    return userLogs.stream().map(this::mapToResponse).toList();
                }
            }
        }
        return logRepository.findTop20ByOrderBySentAtDesc().stream()
                .map(this::mapToResponse)
                .toList();
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
