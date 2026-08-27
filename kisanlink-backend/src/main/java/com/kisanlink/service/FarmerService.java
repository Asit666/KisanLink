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
        farmer.setAddress(request.address());
        farmer.setDistrict(request.district());
        farmer.setState(request.state());
        farmer.setLatitude(request.latitude());
        farmer.setLongitude(request.longitude());
        return farmerRepository.save(farmer);
    }

    @Transactional
    public FarmerProduce addProduce(Long farmerId, ProduceRequest request) {
        var farmer = farmerRepository.findById(farmerId)
                .orElseThrow(() -> new IllegalArgumentException("Farmer not found: " + farmerId));
        var crop = cropRepository.findById(request.cropId())
                .orElseThrow(() -> new IllegalArgumentException("Crop not found: " + request.cropId()));
        FarmerProduce produce = new FarmerProduce();
        produce.setFarmer(farmer);
        produce.setCrop(crop);
        produce.setQuantity(request.quantity());
        produce.setQuality(request.quality());
        produce.setHarvestDate(request.harvestDate());
        produce.setAvailableUntil(request.availableUntil());
        produce.setExpectedPrice(request.expectedPrice());
        return produceRepository.save(produce);
    }

    public void deleteProduce(Long id) {
        if (!produceRepository.existsById(id)) {
            throw new IllegalArgumentException("Produce not found: " + id);
        }
        produceRepository.deleteById(id);
    }
}
