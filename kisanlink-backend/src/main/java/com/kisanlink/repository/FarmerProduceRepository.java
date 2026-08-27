package com.kisanlink.repository;

import com.kisanlink.entity.FarmerProduce;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FarmerProduceRepository extends JpaRepository<FarmerProduce, Long> {
    List<FarmerProduce> findByFarmerId(Long farmerId);
    List<FarmerProduce> findByCropId(Long cropId);
}
