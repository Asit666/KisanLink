package com.kisanlink.repository;

import com.kisanlink.entity.TransporterVehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransporterVehicleRepository extends JpaRepository<TransporterVehicle, Long> {
    List<TransporterVehicle> findByTransporterIdOrderByCreatedAtDesc(Long transporterId);
    List<TransporterVehicle> findByTransporterIdAndActiveTrue(Long transporterId);
}
