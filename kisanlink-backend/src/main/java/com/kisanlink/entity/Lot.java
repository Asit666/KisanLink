package com.kisanlink.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "lots")
@Getter
@Setter
@NoArgsConstructor
public class Lot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "fpo_id", nullable = false)
    private FpoProfile fpoProfile;

    @Column(nullable = false)
    private String cropName;

    @Column(nullable = false)
    private Double quantityKg;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Grade grade;

    private String moistureLevel;

    @Column(nullable = false)
    private LocalDate harvestDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LotStatus status = LotStatus.AVAILABLE;

    @Column(columnDefinition = "TEXT")
    private String photosUrl; // JSON array of URLs
}
