package com.kisanlink.repository;

import com.kisanlink.entity.Transporter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TransporterRepository extends JpaRepository<Transporter, Long> {

    Optional<Transporter> findByUserId(Long userId);

    List<Transporter> findByAvailableTrue();

    List<Transporter> findByBaseStateIgnoreCaseAndAvailableTrue(String state);

    @Query("SELECT t FROM Transporter t WHERE t.available = true AND t.capacityKg >= :minCapacity")
    List<Transporter> findAvailableWithMinCapacity(java.math.BigDecimal minCapacity);
}
