package com.kisanlink.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;

@Entity
@Table(name = "price_predictions")
@Getter
@Setter
@NoArgsConstructor
public class PricePrediction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Crop crop;

    @ManyToOne
    private Market market;

    @Column(nullable = false)
    private LocalDate predictionDate;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal predictedPrice;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal lowerBound;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal upperBound;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PriceTrend trend;

    @Column(nullable = false)
    private String modelVersion = "baseline-trend-v1";

    private Instant createdAt = Instant.now();
}
