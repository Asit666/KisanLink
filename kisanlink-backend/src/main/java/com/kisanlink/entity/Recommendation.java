package com.kisanlink.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "recommendations")
@Getter
@Setter
@NoArgsConstructor
public class Recommendation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Farmer farmer;

    @ManyToOne(optional = false)
    private FarmerProduce produce;

    @ManyToOne(optional = false)
    private Buyer buyer;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal sellingPrice;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal transportCost;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal grossRevenue;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal netReturn;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "explanation", nullable = false, length = 1000)
    private String reason;


    private Instant createdAt = Instant.now();
}
