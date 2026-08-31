package com.kisanlink.repository;

import com.kisanlink.entity.BookingStatus;
import com.kisanlink.entity.TransportBooking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransportBookingRepository extends JpaRepository<TransportBooking, Long> {

    Optional<TransportBooking> findFirstByTradeDealIdOrderByCreatedAtDesc(Long dealId);

    List<TransportBooking> findByTradeDealId(Long dealId);

    List<TransportBooking> findByTransporterIdOrderByCreatedAtDesc(Long transporterId);

    List<TransportBooking> findByTransporterIdAndStatus(Long transporterId, BookingStatus status);
}
