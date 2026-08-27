package com.kisanlink.service;

import com.kisanlink.dto.PriceAlertEvent;
import com.kisanlink.dto.RealTimeNotificationEvent;
import com.kisanlink.entity.Notification;
import com.kisanlink.entity.TradeDeal;
import com.kisanlink.entity.User;
import com.kisanlink.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;

@Service
public class NotificationWebSocketService {

    private static final Logger log = LoggerFactory.getLogger(NotificationWebSocketService.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;

    public NotificationWebSocketService(SimpMessagingTemplate messagingTemplate,
                                        NotificationRepository notificationRepository) {
        this.messagingTemplate = messagingTemplate;
        this.notificationRepository = notificationRepository;
    }

    /**
     * Sends a real-time notification to a specific user and persists it in the database.
     */
    public void sendUserNotification(User targetUser, String eventType, String title, String message, Long relatedId, Object payload) {
        if (targetUser == null) {
            return;
        }

        try {
            // 1. Persist notification to database for offline retrieval
            Notification notification = new Notification();
            notification.setUser(targetUser);
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setRead(false);
            notificationRepository.save(notification);

            // 2. Broadcast via WebSocket STOMP topic to target user
            RealTimeNotificationEvent event = new RealTimeNotificationEvent(
                    eventType,
                    title,
                    message,
                    relatedId,
                    payload,
                    Instant.now()
            );

            String destination = "/topic/notifications/user/" + targetUser.getId();
            messagingTemplate.convertAndSend(destination, event);
            log.info("Dispatched real-time notification to destination [{}]: {}", destination, title);
        } catch (Exception e) {
            log.warn("Failed to dispatch real-time WebSocket notification: {}", e.getMessage());
        }
    }

    /**
     * Broadcasts live trade state updates directly to the specific user's trade topic.
     */
    public void sendTradeUpdate(User targetUser, TradeDeal deal, String actionMessage) {
        if (targetUser == null || deal == null) {
            return;
        }

        try {
            String tradeTopic = "/topic/trades/user/" + targetUser.getId();
            RealTimeNotificationEvent event = new RealTimeNotificationEvent(
                    "TRADE_STATUS_CHANGED",
                    "Trade Deal #" + deal.getId() + " Updated",
                    actionMessage,
                    deal.getId(),
                    deal.getStatus().name(),
                    Instant.now()
            );
            messagingTemplate.convertAndSend(tradeTopic, event);
            log.info("Dispatched trade update to [{}]: status {}", tradeTopic, deal.getStatus());
        } catch (Exception e) {
            log.warn("Failed to dispatch trade WebSocket update: {}", e.getMessage());
        }
    }

    /**
     * Broadcasts matching buyer requirement alert to a farmer whose produce matches.
     */
    public void notifyMatchingBuyerRequirement(User farmerUser, String cropName, BigDecimal quantity, BigDecimal offeredPrice, Long requirementId) {
        if (farmerUser == null) {
            return;
        }

        String title = "New Buyer Match: " + cropName;
        String message = String.format("A buyer posted a requirement for %s kg of %s at ₹%s/kg.",
                quantity.stripTrailingZeros().toPlainString(),
                cropName,
                offeredPrice.stripTrailingZeros().toPlainString());

        sendUserNotification(farmerUser, "BUYER_REQUIREMENT_MATCHED", title, message, requirementId, null);
    }

    /**
     * Broadcasts general market price spike/drop alerts across regional mandis.
     */
    public void broadcastPriceAlert(PriceAlertEvent event) {
        try {
            String destination = "/topic/prices/alerts";
            messagingTemplate.convertAndSend(destination, event);
            log.info("Broadcasted market price alert to [{}]: {} at ₹{}", destination, event.cropName(), event.newPrice());
        } catch (Exception e) {
            log.warn("Failed to broadcast price alert: {}", e.getMessage());
        }
    }
}
