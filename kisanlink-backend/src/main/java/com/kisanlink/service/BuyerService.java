package com.kisanlink.service;

import com.kisanlink.dto.BuyerRequirementRequest;
import com.kisanlink.dto.BuyerProfileRequest;
import com.kisanlink.entity.Buyer;
import com.kisanlink.entity.BuyerRequirement;
import com.kisanlink.repository.BuyerRepository;
import com.kisanlink.repository.BuyerRequirementRepository;
import com.kisanlink.repository.CropRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BuyerService {
    private final BuyerRepository buyerRepository;
    private final CropRepository cropRepository;
    private final BuyerRequirementRepository requirementRepository;

    public BuyerService(BuyerRepository buyerRepository, CropRepository cropRepository,
                        BuyerRequirementRepository requirementRepository) {
        this.buyerRepository = buyerRepository;
        this.cropRepository = cropRepository;
        this.requirementRepository = requirementRepository;
    }

    public List<BuyerRequirement> listRequirements(Long buyerId) {
        return requirementRepository.findByBuyerId(buyerId);
    }

    public Buyer getProfile(Long buyerId) {
        return buyerRepository.findById(buyerId)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found: " + buyerId));
    }

    @Transactional
    public Buyer updateProfile(Long buyerId, BuyerProfileRequest request) {
        Buyer buyer = getProfile(buyerId);
        buyer.setBusinessName(request.businessName());
        buyer.setBusinessType(request.businessType());
        buyer.setAddress(request.address());
        buyer.setDistrict(request.district());
        buyer.setState(request.state());
        buyer.setLatitude(request.latitude());
        buyer.setLongitude(request.longitude());
        return buyerRepository.save(buyer);
    }

    @Transactional
    public BuyerRequirement addRequirement(Long buyerId, BuyerRequirementRequest request) {
        var buyer = buyerRepository.findById(buyerId)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found: " + buyerId));
        var crop = cropRepository.findById(request.cropId())
                .orElseThrow(() -> new IllegalArgumentException("Crop not found: " + request.cropId()));
        BuyerRequirement requirement = new BuyerRequirement();
        requirement.setBuyer(buyer);
        requirement.setCrop(crop);
        requirement.setRequiredQuantity(request.requiredQuantity());
        requirement.setQualityRequired(request.qualityRequired());
        requirement.setOfferedPrice(request.offeredPrice());
        requirement.setValidUntil(request.validUntil());
        requirement.setLocation(request.location());
        return requirementRepository.save(requirement);
    }

    public void deleteRequirement(Long id) {
        if (!requirementRepository.existsById(id)) {
            throw new IllegalArgumentException("Requirement not found: " + id);
        }
        requirementRepository.deleteById(id);
    }
}
