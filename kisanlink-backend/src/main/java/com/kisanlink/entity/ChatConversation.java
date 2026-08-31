package com.kisanlink.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "chat_conversations")
@Getter
@Setter
@NoArgsConstructor
public class ChatConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long farmerId;

    @Column(nullable = false)
    private Long buyerId;

    private String farmerName;

    private String buyerName;

    private String cropName;

    private Long tradeDealId;

    @Column(columnDefinition = "TEXT")
    private String lastMessageText;

    @Column(nullable = false)
    private Instant lastMessageAt = Instant.now();

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        if (lastMessageAt == null) lastMessageAt = Instant.now();
    }
}
