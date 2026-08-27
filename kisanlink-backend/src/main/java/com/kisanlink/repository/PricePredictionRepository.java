package com.kisanlink.repository;

import com.kisanlink.entity.PricePrediction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PricePredictionRepository extends JpaRepository<PricePrediction, Long> {
    List<PricePrediction> findByCropIdOrderByPredictionDateAsc(Long cropId);
    List<PricePrediction> findByCropIdAndMarketIdOrderByPredictionDateAsc(Long cropId, Long marketId);
}
