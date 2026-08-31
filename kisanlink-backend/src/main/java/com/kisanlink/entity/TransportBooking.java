package com.kisanlink.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "transport_bookings")
@Getter
@Setter
@NoArgsConstructor
public class TransportBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "trade_deal_id", nullable = false)
    private TradeDeal tradeDeal;

    @ManyToOne(optional = false)
    @JoinColumn(name = "transporter_id", nullable = false)
    private Transporter transporter;

    /** Role that created this booking — always FARMER as per design */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role requestedBy = Role.FARMER;

    /* Pickup = farmer location */
    private Double pickupLatitude;
    private Double pickupLongitude;
    private String pickupAddress;

    /* Delivery = buyer location */
    private Double deliveryLatitude;
    private Double deliveryLongitude;
    private String deliveryAddress;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal distanceKm = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal estimatedCost = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;

    private LocalDate scheduledDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private Instant confirmedAt;
    private Instant deliveredAt;

    /* Proof of Pickup (POP) */
    @Column(length = 10)
    private String pickupCode;

    private Instant pickedUpAt;

    @Column(precision = 10, scale = 2)
    private BigDecimal pickupQuantityKg;

    @Column(columnDefinition = "TEXT")
    private String pickupNotes;

    /* Proof of Delivery (POD) */
    @Column(length = 10)
    private String deliveryCode;

    @Column(precision = 10, scale = 2)
    private BigDecimal deliveredQuantityKg;

    @Column(columnDefinition = "TEXT")
    private String deliveryNotes;

    @Column(precision = 10, scale = 2)
    private BigDecimal discrepancyKg;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
