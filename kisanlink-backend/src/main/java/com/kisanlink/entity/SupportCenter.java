package com.kisanlink.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "support_centers")
@Getter
@Setter
@NoArgsConstructor
public class SupportCenter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "center_type", nullable = false)
    private String centerType;

    private String badge;
    private String designation;
    private String department;

    @Column(nullable = false)
    private String district;

    @Column(nullable = false)
    private String state;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    private String rating;
    private String phone;

    @Column(name = "toll_free")
    private String tollFree;

    @Column(name = "operating_hours")
    private String operatingHours;

    @Column(columnDefinition = "TEXT")
    private String services;

    @Column(name = "in_charge")
    private String inCharge;

    private Boolean verified = true;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
}
