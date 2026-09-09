package com.kisanlink.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "fpos")
@Getter
@Setter
@NoArgsConstructor
public class FpoProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String fpoName;

    private String registrationNo;
    private String district;
    private String state;
    
    @Column(nullable = false)
    private Double trustScore = 100.0;
}
