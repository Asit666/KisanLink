package com.kisanlink.service;

import com.kisanlink.entity.Crop;
import com.kisanlink.entity.CropCategory;
import com.kisanlink.repository.CropRepository;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class CropService {
    private final CropRepository cropRepository;

    public CropService(CropRepository cropRepository) {
        this.cropRepository = cropRepository;
    }

    public List<Crop> findAll() {
        return cropRepository.findAll();
    }

    public List<Crop> findByCategory(CropCategory category) {
        return cropRepository.findByCategory(category);
    }

    public List<CropCategory> findAllCategories() {
        return Arrays.asList(CropCategory.values());
    }

    public Crop findById(Long id) {
        return cropRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Crop not found: " + id));
    }

    public Crop create(Crop crop) {
        return cropRepository.save(crop);
    }
}

