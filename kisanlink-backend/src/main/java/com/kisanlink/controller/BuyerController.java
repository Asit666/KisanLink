package com.kisanlink.controller;

import com.kisanlink.dto.BuyerRequirementRequest;
import com.kisanlink.dto.BuyerProfileRequest;
import com.kisanlink.entity.Buyer;
import com.kisanlink.entity.BuyerRequirement;
import com.kisanlink.security.OwnershipService;
import com.kisanlink.service.BuyerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buyers")
public class BuyerController {
    private final BuyerService buyerService;
    private final OwnershipService ownershipService;

    public BuyerController(BuyerService buyerService, OwnershipService ownershipService) {
        this.buyerService = buyerService;
        this.ownershipService = ownershipService;
    }

    /** Public read — any authenticated buyer may view any profile. */
    @GetMapping("/{buyerId}")
    public Buyer getProfile(@PathVariable Long buyerId) {
        return buyerService.getProfile(buyerId);
    }

    /** Ownership-protected: only the buyer who owns this profile may update it. */
    @PutMapping("/{buyerId}")
    public Buyer updateProfile(@PathVariable Long buyerId,
                               @RequestBody BuyerProfileRequest request,
                               @AuthenticationPrincipal UserDetails principal) {
        ownershipService.checkBuyerOwnership(buyerId, principal.getUsername());
        return buyerService.updateProfile(buyerId, request);
    }

    /** Public read — any authenticated buyer may view requirements. */
    @GetMapping("/{buyerId}/requirements")
    public List<BuyerRequirement> listRequirements(@PathVariable Long buyerId) {
        return buyerService.listRequirements(buyerId);
    }

    /** Ownership-protected: only the buyer who owns this profile may add requirements. */
    @PostMapping("/{buyerId}/requirements")
    @ResponseStatus(HttpStatus.CREATED)
    public BuyerRequirement addRequirement(@PathVariable Long buyerId,
                                           @Valid @RequestBody BuyerRequirementRequest request,
                                           @AuthenticationPrincipal UserDetails principal) {
        ownershipService.checkBuyerOwnership(buyerId, principal.getUsername());
        return buyerService.addRequirement(buyerId, request);
    }

    /** Ownership-protected: only the buyer who created this requirement may delete it. */
    @DeleteMapping("/requirements/{requirementId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRequirement(@PathVariable Long requirementId,
                                   @AuthenticationPrincipal UserDetails principal) {
        ownershipService.checkRequirementOwnership(requirementId, principal.getUsername());
        buyerService.deleteRequirement(requirementId);
    }
}
