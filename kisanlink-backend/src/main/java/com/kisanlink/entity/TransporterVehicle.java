package com.kisanlink.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "transporter_vehicles")
@Getter
@Setter
@NoArgsConstructor
public class TransporterVehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "transporter_id", nullable = false)
    private Transporter transporter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleType vehicleType = VehicleType.MINI_TRUCK;

    @Column(nullable = false, length = 30)
    private String vehicleNumber;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal capacityKg = BigDecimal.valueOf(2000);

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal ratePerKm = BigDecimal.valueOf(15);

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal baseCharge = BigDecimal.valueOf(100);

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, length = 20)
    private String status = "AVAILABLE"; // AVAILABLE, IN_USE, MAINTENANCE

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
