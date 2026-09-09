package com.kisanlink.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "farmers")
@Getter
@Setter
@NoArgsConstructor
public class Farmer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = true)
    @JoinColumn(name = "user_id", nullable = true, unique = true)
    private User user;

    @ManyToOne(optional = true)
    @JoinColumn(name = "fpo_id", nullable = true)
    private FpoProfile fpoProfile;

    private String name;
    private String phone;
    private String village;
    private Double landSizeAcres;

    private String address;
    private String district;
    private String state;
    private Double latitude;
    private Double longitude;
    private String alertEmail;

    public String getName() {
        if (name != null && !name.trim().isEmpty()) return name;
        return user != null ? user.getName() : "Farmer #" + id;
    }

    public String getPhone() {
        if (phone != null && !phone.trim().isEmpty()) return phone;
        return user != null ? user.getPhone() : null;
    }

    public String getDistrict() {
        if (district != null && !district.trim().isEmpty()) return district;
        return fpoProfile != null ? fpoProfile.getDistrict() : null;
    }

    public String getState() {
        if (state != null && !state.trim().isEmpty()) return state;
        return fpoProfile != null ? fpoProfile.getState() : null;
    }
}
