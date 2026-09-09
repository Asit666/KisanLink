package com.kisanlink.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "demands")
@Getter
@Setter
@NoArgsConstructor
public class Demand {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private Buyer buyer;

    @Column(nullable = false)
    private String cropName;

    @Column(nullable = false)
    private Double minQuantityKg;

    @Column(nullable = false)
    private Double maxQuantityKg;

    @Enumerated(EnumType.STRING)
    private Grade preferredGrade;

    @Column(nullable = false)
    private Double expectedPricePerKg;
}
