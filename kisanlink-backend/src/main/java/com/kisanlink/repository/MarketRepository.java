package com.kisanlink.repository;

import com.kisanlink.entity.Market;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MarketRepository extends JpaRepository<Market, Long> {
    Optional<Market> findByNameIgnoreCase(String name);
}
