package com.kisanlink.repository;

import com.kisanlink.entity.TradeNegotiation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TradeNegotiationRepository extends JpaRepository<TradeNegotiation, Long> {
    List<TradeNegotiation> findByTradeDealIdOrderByCreatedAtAsc(Long tradeDealId);
}
