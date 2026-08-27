package com.kisanlink.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;

@Entity
@Table(name = "buyer_requirements")
@Getter
@Setter
@NoArgsConstructor
public class BuyerRequirement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private Buyer buyer;

    @ManyToOne(optional = false)
    @JoinColumn(name = "crop_id", nullable = false)
    private Crop crop;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal requiredQuantity;

    @Column(nullable = false)
    private String qualityRequired;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal offeredPrice;

    private LocalDate validUntil;
    private String location;
    private Instant createdAt = Instant.now();
}
