package com.kisanlink.security;

import com.kisanlink.entity.Buyer;
import com.kisanlink.entity.BuyerRequirement;
import com.kisanlink.entity.Farmer;
import com.kisanlink.entity.FarmerProduce;
import com.kisanlink.repository.BuyerRepository;
import com.kisanlink.repository.BuyerRequirementRepository;
import com.kisanlink.repository.FarmerProduceRepository;
import com.kisanlink.repository.FarmerRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

/**
 * Enforces resource ownership checks.
 * Call the appropriate method before any mutating operation to ensure
 * the authenticated principal actually owns the resource identified by the URL path variable.
 */
@Service
public class OwnershipService {

    private final FarmerRepository farmerRepository;
    private final BuyerRepository buyerRepository;
    private final FarmerProduceRepository produceRepository;
    private final BuyerRequirementRepository requirementRepository;

    public OwnershipService(FarmerRepository farmerRepository,
                            BuyerRepository buyerRepository,
                            FarmerProduceRepository produceRepository,
                            BuyerRequirementRepository requirementRepository) {
        this.farmerRepository = farmerRepository;
        this.buyerRepository = buyerRepository;
        this.produceRepository = produceRepository;
        this.requirementRepository = requirementRepository;
    }

    /**
     * Verifies that the farmer profile with {@code farmerId} belongs to the user identified by {@code email}.
     *
     * @throws AccessDeniedException if the authenticated user does not own this farmer profile
     */
    public void checkFarmerOwnership(Long farmerId, String email) {
        Farmer farmer = farmerRepository.findById(farmerId)
                .orElseThrow(() -> new IllegalArgumentException("Farmer not found: " + farmerId));
        if (!farmer.getUser().getEmail().equalsIgnoreCase(email)) {
            throw new AccessDeniedException("Access denied: you do not own this farmer profile");
        }
    }

    /**
     * Verifies that the buyer profile with {@code buyerId} belongs to the user identified by {@code email}.
     *
     * @throws AccessDeniedException if the authenticated user does not own this buyer profile
     */
    public void checkBuyerOwnership(Long buyerId, String email) {
        Buyer buyer = buyerRepository.findById(buyerId)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found: " + buyerId));
        if (!buyer.getUser().getEmail().equalsIgnoreCase(email)) {
            throw new AccessDeniedException("Access denied: you do not own this buyer profile");
        }
    }

    /**
     * Verifies that the produce listing with {@code produceId} was created by the farmer
     * whose account email is {@code email}.
     *
     * @throws AccessDeniedException if the authenticated user does not own this produce listing
     */
    public void checkProduceOwnership(Long produceId, String email) {
        FarmerProduce produce = produceRepository.findById(produceId)
                .orElseThrow(() -> new IllegalArgumentException("Produce not found: " + produceId));
        if (!produce.getFarmer().getUser().getEmail().equalsIgnoreCase(email)) {
            throw new AccessDeniedException("Access denied: you do not own this produce listing");
        }
    }

    /**
     * Verifies that the buyer requirement with {@code requirementId} was created by the buyer
     * whose account email is {@code email}.
     *
     * @throws AccessDeniedException if the authenticated user does not own this requirement
     */
    public void checkRequirementOwnership(Long requirementId, String email) {
        BuyerRequirement requirement = requirementRepository.findById(requirementId)
                .orElseThrow(() -> new IllegalArgumentException("Requirement not found: " + requirementId));
        if (!requirement.getBuyer().getUser().getEmail().equalsIgnoreCase(email)) {
            throw new AccessDeniedException("Access denied: you do not own this requirement");
        }
    }

    /**
     * Verifies that the user with {@code email} is either the farmer or the buyer involved in {@code deal}.
     *
     * @throws AccessDeniedException if the authenticated user is neither the farmer nor the buyer of this deal
     */
    public void checkTradeDealAccess(com.kisanlink.entity.TradeDeal deal, String email) {
        boolean isFarmer = deal.getFarmer() != null && deal.getFarmer().getUser().getEmail().equalsIgnoreCase(email);
        boolean isBuyer = deal.getBuyer() != null && deal.getBuyer().getUser().getEmail().equalsIgnoreCase(email);
        if (!isFarmer && !isBuyer) {
            throw new AccessDeniedException("Access denied: you are not a party in this trade deal");
        }
    }
}

