package com.kisanlink.repository;

import com.kisanlink.entity.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FarmerRepository extends JpaRepository<Farmer, Long> {
    List<Farmer> findByFpoProfileId(Long fpoProfileId);
    
    @Query("SELECT f FROM Farmer f LEFT JOIN f.user u LEFT JOIN f.fpoProfile fp LEFT JOIN fp.user fpu WHERE u.email = :email OR fpu.email = :email")
    Optional<Farmer> findByUserEmail(@Param("email") String email);
    
    @Query("SELECT f FROM Farmer f LEFT JOIN f.user u LEFT JOIN f.fpoProfile fp LEFT JOIN fp.user fpu WHERE u.id = :userId OR fpu.id = :userId")
    Optional<Farmer> findByUserId(@Param("userId") Long userId);
}
