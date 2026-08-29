package com.kisanlink.repository;

import com.kisanlink.entity.DiagnosticReport;
import com.kisanlink.entity.DiagnosticStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiagnosticReportRepository extends JpaRepository<DiagnosticReport, Long> {
    List<DiagnosticReport> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);
    List<DiagnosticReport> findByStatusOrderByCreatedAtDesc(DiagnosticStatus status);
}
