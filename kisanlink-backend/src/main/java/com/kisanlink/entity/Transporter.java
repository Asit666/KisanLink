package com.kisanlink.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "transporters")
@Getter
@Setter
@NoArgsConstructor
public class Transporter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleType vehicleType = VehicleType.MINI_TRUCK;

    @Column(length = 20)
    private String vehicleNumber;

    /** Maximum load in kilograms */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal capacityKg = BigDecimal.valueOf(2000);

    private String baseDistrict;
    private String baseState;
    private Double baseLatitude;
    private Double baseLongitude;

    /** Cost per kilometre (INR) */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal ratePerKm = BigDecimal.valueOf(15);

    /** Flat base charge per trip (INR) */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal baseCharge = BigDecimal.valueOf(100);

    @Column(nullable = false)
    private boolean available = true;

    @Column(nullable = false)
    private boolean verified = false;

    @Column(length = 20)
    private String alertPhone;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
