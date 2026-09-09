package com.kisanlink.repository;

import com.kisanlink.entity.LotContribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LotContributionRepository extends JpaRepository<LotContribution, Long> {
    List<LotContribution> findByLotId(Long lotId);
}
