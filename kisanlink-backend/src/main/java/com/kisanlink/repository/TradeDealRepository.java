package com.kisanlink.repository;

import com.kisanlink.entity.TradeDeal;
import com.kisanlink.entity.TradeStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TradeDealRepository extends JpaRepository<TradeDeal, Long> {
    List<TradeDeal> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
    List<TradeDeal> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);
    List<TradeDeal> findByFarmerIdAndStatusOrderByCreatedAtDesc(Long farmerId, TradeStatus status);
    List<TradeDeal> findByBuyerIdAndStatusOrderByCreatedAtDesc(Long buyerId, TradeStatus status);
}
