package com.kisanlink.repository;

import com.kisanlink.entity.SmsWhatsAppLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SmsWhatsAppLogRepository extends JpaRepository<SmsWhatsAppLog, Long> {
    List<SmsWhatsAppLog> findTop20ByOrderBySentAtDesc();
    List<SmsWhatsAppLog> findByUserIdOrderBySentAtDesc(Long userId);
}
