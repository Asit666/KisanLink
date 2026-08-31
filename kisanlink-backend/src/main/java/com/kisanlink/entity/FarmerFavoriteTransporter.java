package com.kisanlink.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "farmer_favorite_transporters", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"farmer_id", "transporter_id"})
})
@Getter
@Setter
@NoArgsConstructor
public class FarmerFavoriteTransporter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "farmer_id", nullable = false)
    private Farmer farmer;

    @ManyToOne(optional = false)
    @JoinColumn(name = "transporter_id", nullable = false)
    private Transporter transporter;

    @Column(length = 255)
    private String notes;

    private Instant createdAt = Instant.now();

    public FarmerFavoriteTransporter(Farmer farmer, Transporter transporter) {
        this.farmer = farmer;
        this.transporter = transporter;
        this.createdAt = Instant.now();
    }
}
