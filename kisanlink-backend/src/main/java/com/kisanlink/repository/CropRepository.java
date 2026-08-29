package com.kisanlink.repository;

import com.kisanlink.entity.Crop;
import com.kisanlink.entity.CropCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CropRepository extends JpaRepository<Crop, Long> {
    List<Crop> findByCategory(CropCategory category);
    Optional<Crop> findByNameIgnoreCase(String name);
    List<Crop> findByNameContainingIgnoreCase(String name);
}



