package com.kisanlink.repository;

import com.kisanlink.entity.FarmerFavoriteTransporter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FarmerFavoriteTransporterRepository extends JpaRepository<FarmerFavoriteTransporter, Long> {
    List<FarmerFavoriteTransporter> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
    Optional<FarmerFavoriteTransporter> findByFarmerIdAndTransporterId(Long farmerId, Long transporterId);
    boolean existsByFarmerIdAndTransporterId(Long farmerId, Long transporterId);
    void deleteByFarmerIdAndTransporterId(Long farmerId, Long transporterId);
}
