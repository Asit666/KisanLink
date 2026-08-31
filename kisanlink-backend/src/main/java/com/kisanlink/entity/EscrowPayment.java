package com.kisanlink.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "escrow_payments")
@Getter
@Setter
@NoArgsConstructor
public class EscrowPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "trade_deal_id", nullable = false, unique = true)
    private TradeDeal tradeDeal;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal depositAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal farmerPayout;

    /** Transport fee paid by Buyer — added to total escrow once a transporter is booked. */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal transporterPayout = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EscrowStatus status = EscrowStatus.PENDING_DEPOSIT;

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod = PaymentMethod.UPI_INSTANT;

    private String upiRef;
    private String farmerUpiId;
    private String buyerUpiId;
    private String settlementUtr;

    @Column(columnDefinition = "TEXT")
    private String disputeReason;

    private Instant depositedAt;
    private Instant releasedAt;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
