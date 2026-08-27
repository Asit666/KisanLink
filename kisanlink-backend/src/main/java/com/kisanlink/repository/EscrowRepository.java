package com.kisanlink.repository;

import com.kisanlink.entity.EscrowPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EscrowRepository extends JpaRepository<EscrowPayment, Long> {
    Optional<EscrowPayment> findByTradeDealId(Long tradeDealId);
}
