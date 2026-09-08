package com.kisanlink.repository;

import com.kisanlink.entity.SupportCenter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportCenterRepository extends JpaRepository<SupportCenter, Long> {
    List<SupportCenter> findByCenterType(String centerType);
    List<SupportCenter> findByDistrictIgnoreCase(String district);
    List<SupportCenter> findByStateIgnoreCase(String state);
}
