package com.kisanlink.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "trade_disputes")
@Getter
@Setter
@NoArgsConstructor
public class TradeDispute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "trade_deal_id", nullable = false)
    private TradeDeal tradeDeal;

    @Column(nullable = false, length = 20)
    private String raisedByRole; // FARMER, BUYER

    @ManyToOne(optional = false)
    @JoinColumn(name = "raised_by_user_id", nullable = false)
    private User raisedByUser;

    @Column(nullable = false, length = 40)
    private String disputeType; // QUANTITY_DISCREPANCY, DAMAGED_CARGO, TRANSIT_DELAY, PAYMENT_ISSUE

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal claimAmount = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    private String status = "OPEN"; // OPEN, UNDER_REVIEW, RESOLVED, REJECTED

    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;

    private Instant createdAt = Instant.now();
    private Instant resolvedAt;
}
