package com.kisanlink.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long conversationId;

    @Column(nullable = false, length = 20)
    private String senderRole; // FARMER, BUYER

    @Column(nullable = false)
    private Long senderId;

    @Column(nullable = false, length = 100)
    private String senderName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String messageText;

    @Column(nullable = false)
    private boolean isOffer = false;

    private String offerCropName;

    @Column(precision = 10, scale = 2)
    private BigDecimal offerQuantityKg;

    @Column(precision = 10, scale = 2)
    private BigDecimal offerPricePerKg;

    @Column(precision = 12, scale = 2)
    private BigDecimal offerTotalAmount;

    @Column(length = 20)
    private String offerStatus; // PENDING, ACCEPTED, COUNTERED, REJECTED

    @Column(nullable = false)
    private Instant sentAt = Instant.now();

    private Instant readAt;

    @PrePersist
    protected void onCreate() {
        if (sentAt == null) sentAt = Instant.now();
    }
}
