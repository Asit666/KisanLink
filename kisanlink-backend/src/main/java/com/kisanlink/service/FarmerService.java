package com.kisanlink.service;

import com.kisanlink.dto.ProduceRequest;
import com.kisanlink.dto.FarmerProfileRequest;
import com.kisanlink.entity.Farmer;
import com.kisanlink.entity.FarmerProduce;
import com.kisanlink.repository.CropRepository;
import com.kisanlink.repository.FarmerProduceRepository;
import com.kisanlink.repository.FarmerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FarmerService {
    private final FarmerRepository farmerRepository;
    private final CropRepository cropRepository;
    private final FarmerProduceRepository produceRepository;

    public FarmerService(FarmerRepository farmerRepository, CropRepository cropRepository,
                         FarmerProduceRepository produceRepository) {
        this.farmerRepository = farmerRepository;
        this.cropRepository = cropRepository;
        this.produceRepository = produceRepository;
    }

    public List<FarmerProduce> listProduce(Long farmerId) {
        return produceRepository.findByFarmerId(farmerId);
    }

    public Farmer getProfile(Long farmerId) {
        return farmerRepository.findById(farmerId)
                .orElseThrow(() -> new IllegalArgumentException("Farmer not found: " + farmerId));
    }

    @Transactional
    public Farmer updateProfile(Long farmerId, FarmerProfileRequest request) {
        Farmer farmer = getProfile(farmerId);
        if (request.address() != null) farmer.setAddress(request.address());
        if (request.district() != null) farmer.setDistrict(request.district());
        if (request.state() != null) farmer.setState(request.state());
        if (request.latitude() != null) farmer.setLatitude(request.latitude());
        if (request.longitude() != null) farmer.setLongitude(request.longitude());
        if (request.alertEmail() != null) farmer.setAlertEmail(request.alertEmail());
        // Also update the linked User phone
        if (request.phone() != null && !request.phone().isBlank()) {
            farmer.getUser().setPhone(request.phone());
        }
        return farmerRepository.save(farmer);
    }


    @Transactional
    public FarmerProduce addProduce(Long farmerId, ProduceRequest request) {
        var farmer = farmerRepository.findById(farmerId)
                .orElseThrow(() -> new IllegalArgumentException("Farmer not found: " + farmerId));

        com.kisanlink.entity.Crop crop;
        if (request.cropId() != null) {
            crop = cropRepository.findById(request.cropId())
                    .orElseThrow(() -> new IllegalArgumentException("Crop not found: " + request.cropId()));
        } else if (request.cropName() != null && !request.cropName().isBlank()) {
            String trimmedName = request.cropName().trim();
            crop = cropRepository.findByNameIgnoreCase(trimmedName)
                    .orElseGet(() -> {
                        com.kisanlink.entity.Crop newCrop = new com.kisanlink.entity.Crop();
                        newCrop.setName(trimmedName);
                        newCrop.setCategory(request.category() != null ? request.category() : com.kisanlink.entity.CropCategory.OTHER);
                        newCrop.setUnit("kg");
                        return cropRepository.save(newCrop);
                    });
        } else {
            throw new IllegalArgumentException("Either cropId or cropName must be provided");
        }

        FarmerProduce produce = new FarmerProduce();
        produce.setFarmer(farmer);
        produce.setCrop(crop);
        produce.setQuantity(request.quantity());
        produce.setQuality(request.quality());
        produce.setHarvestDate(request.harvestDate());
        produce.setAvailableUntil(request.availableUntil());
        produce.setExpectedPrice(request.expectedPrice());
        produce.setImageUrl(request.imageUrl());
        produce.setDescription(request.description());
        return produceRepository.save(produce);
    }


    public void deleteProduce(Long id) {
        if (!produceRepository.existsById(id)) {
            throw new IllegalArgumentException("Produce not found: " + id);
        }
        produceRepository.deleteById(id);
    }
}
