package com.kisanlink.repository;

import com.kisanlink.entity.FpoProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FpoProfileRepository extends JpaRepository<FpoProfile, Long> {
    Optional<FpoProfile> findByUserId(Long userId);
}
