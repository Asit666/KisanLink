package com.kisanlink.repository;

import com.kisanlink.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {
    List<Recommendation> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
}
