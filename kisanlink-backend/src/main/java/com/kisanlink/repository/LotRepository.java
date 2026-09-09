package com.kisanlink.repository;

import com.kisanlink.entity.Lot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LotRepository extends JpaRepository<Lot, Long> {
    List<Lot> findByFpoProfileId(Long fpoProfileId);
}
