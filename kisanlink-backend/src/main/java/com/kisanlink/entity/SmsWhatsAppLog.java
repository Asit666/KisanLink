package com.kisanlink.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "sms_whatsapp_logs")
@Getter
@Setter
@NoArgsConstructor
public class SmsWhatsAppLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String recipientPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageChannel channel = MessageChannel.SMS;

    @Column(nullable = false)
    private String messageType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    private String providerMessageId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageStatus status = MessageStatus.DELIVERED;

    private Instant sentAt = Instant.now();
    private Instant createdAt = Instant.now();
}
