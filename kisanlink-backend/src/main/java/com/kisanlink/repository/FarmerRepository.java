package com.kisanlink.repository;

import com.kisanlink.entity.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FarmerRepository extends JpaRepository<Farmer, Long> {
    Optional<Farmer> findByUserId(Long userId);
    Optional<Farmer> findByUserEmail(String email);
}
