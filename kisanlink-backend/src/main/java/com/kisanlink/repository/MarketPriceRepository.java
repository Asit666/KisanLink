package com.kisanlink.repository;

import com.kisanlink.entity.MarketPrice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MarketPriceRepository extends JpaRepository<MarketPrice, Long> {
    List<MarketPrice> findByCropIdOrderByDateDesc(Long cropId);
    List<MarketPrice> findByCropIdAndDateBetweenOrderByDateAsc(Long cropId, LocalDate from, LocalDate to);
    Optional<MarketPrice> findByMarketIdAndCropIdAndDate(Long marketId, Long cropId, LocalDate date);
}
