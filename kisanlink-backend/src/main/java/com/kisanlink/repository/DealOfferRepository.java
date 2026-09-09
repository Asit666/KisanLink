package com.kisanlink.repository;

import com.kisanlink.entity.DealOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DealOfferRepository extends JpaRepository<DealOffer, Long> {
    List<DealOffer> findByLotId(Long lotId);
    List<DealOffer> findByBuyerId(Long buyerId);
}
