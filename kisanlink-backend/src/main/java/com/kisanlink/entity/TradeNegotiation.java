package com.kisanlink.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "trade_negotiations")
@Getter
@Setter
@NoArgsConstructor
public class TradeNegotiation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "trade_deal_id", nullable = false)
    private TradeDeal tradeDeal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role senderRole;

    @Column(nullable = false)
    private String senderName;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal proposedPricePerKg;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal proposedQuantity;

    @Column(columnDefinition = "TEXT")
    private String message;

    private Instant createdAt = Instant.now();
}
