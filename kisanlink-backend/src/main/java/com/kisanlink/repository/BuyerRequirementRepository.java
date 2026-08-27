package com.kisanlink.repository;

import com.kisanlink.entity.BuyerRequirement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BuyerRequirementRepository extends JpaRepository<BuyerRequirement, Long> {
    List<BuyerRequirement> findByBuyerId(Long buyerId);
    List<BuyerRequirement> findByCropId(Long cropId);
}
