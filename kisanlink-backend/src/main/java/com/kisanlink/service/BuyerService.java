package com.kisanlink.service;

import com.kisanlink.dto.BuyerRequirementRequest;
import com.kisanlink.dto.BuyerProfileRequest;
import com.kisanlink.entity.Buyer;
import com.kisanlink.entity.BuyerRequirement;
import com.kisanlink.repository.BuyerRepository;
import com.kisanlink.repository.BuyerRequirementRepository;
import com.kisanlink.repository.CropRepository;
import com.kisanlink.repository.FarmerProduceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BuyerService {
    private final BuyerRepository buyerRepository;
    private final CropRepository cropRepository;
    private final BuyerRequirementRepository requirementRepository;
    private final FarmerProduceRepository produceRepository;
    private final NotificationWebSocketService notificationWebSocketService;

    public BuyerService(BuyerRepository buyerRepository,
                        CropRepository cropRepository,
                        BuyerRequirementRepository requirementRepository,
                        FarmerProduceRepository produceRepository,
                        NotificationWebSocketService notificationWebSocketService) {
        this.buyerRepository = buyerRepository;
        this.cropRepository = cropRepository;
        this.requirementRepository = requirementRepository;
        this.produceRepository = produceRepository;
        this.notificationWebSocketService = notificationWebSocketService;
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
        if (request.alertEmail() != null) buyer.setAlertEmail(request.alertEmail());
        if (request.phone() != null && !request.phone().isBlank()) {
            buyer.getUser().setPhone(request.phone());
        }
        return buyerRepository.save(buyer);

    }

    @Transactional
    public BuyerRequirement addRequirement(Long buyerId, BuyerRequirementRequest request) {
        var buyer = buyerRepository.findById(buyerId)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found: " + buyerId));

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

        BuyerRequirement requirement = new BuyerRequirement();
        requirement.setBuyer(buyer);
        requirement.setCrop(crop);
        requirement.setRequiredQuantity(request.requiredQuantity());
        requirement.setQualityRequired(request.qualityRequired());
        requirement.setOfferedPrice(request.offeredPrice());
        requirement.setValidUntil(request.validUntil());
        requirement.setLocation(request.location());
        BuyerRequirement saved = requirementRepository.save(requirement);

        // Real-time notification to all farmers with matching active produce
        try {
            List<com.kisanlink.entity.FarmerProduce> matchingProduces = produceRepository.findByCropId(crop.getId());
            java.util.Set<Long> notifiedUserIds = new java.util.HashSet<>();
            for (com.kisanlink.entity.FarmerProduce produce : matchingProduces) {
                if (produce.getFarmer() != null && produce.getFarmer().getUser() != null) {
                    Long userId = produce.getFarmer().getUser().getId();
                    if (!notifiedUserIds.contains(userId)) {
                        notifiedUserIds.add(userId);
                        notificationWebSocketService.notifyMatchingBuyerRequirement(
                                produce.getFarmer().getUser(),
                                crop.getName(),
                                saved.getRequiredQuantity(),
                                saved.getOfferedPrice(),
                                saved.getId()
                        );
                    }
                }
            }
        } catch (Exception e) {
            // Non-blocking notification dispatch
        }

        return saved;
    }


    public void deleteRequirement(Long id) {
        if (!requirementRepository.existsById(id)) {
            throw new IllegalArgumentException("Requirement not found: " + id);
        }
        requirementRepository.deleteById(id);
    }
}
