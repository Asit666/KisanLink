package com.kisanlink.repository;

import com.kisanlink.entity.TradeDispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TradeDisputeRepository extends JpaRepository<TradeDispute, Long> {
    List<TradeDispute> findByTradeDealIdOrderByCreatedAtDesc(Long tradeDealId);
    List<TradeDispute> findByRaisedByUserIdOrderByCreatedAtDesc(Long userId);
}
