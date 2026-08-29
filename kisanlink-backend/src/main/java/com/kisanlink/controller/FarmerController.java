package com.kisanlink.controller;

import com.kisanlink.dto.ProduceRequest;
import com.kisanlink.dto.FarmerProfileRequest;
import com.kisanlink.entity.Farmer;
import com.kisanlink.entity.FarmerProduce;
import com.kisanlink.security.OwnershipService;
import com.kisanlink.service.FarmerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/farmers")
public class FarmerController {
    private final FarmerService farmerService;
    private final OwnershipService ownershipService;

    public FarmerController(FarmerService farmerService, OwnershipService ownershipService) {
        this.farmerService = farmerService;
        this.ownershipService = ownershipService;
    }

    /** Ownership-protected: only the farmer who owns this profile may view it. */
    @GetMapping("/{farmerId}")
    public Farmer getProfile(@PathVariable Long farmerId,
                             @AuthenticationPrincipal UserDetails principal) {
        ownershipService.checkFarmerOwnership(farmerId, principal.getUsername());
        return farmerService.getProfile(farmerId);
    }


    /** Ownership-protected: only the farmer who owns this profile may update it. */
    @PutMapping("/{farmerId}")
    public Farmer updateProfile(@PathVariable Long farmerId,
                                @RequestBody FarmerProfileRequest request,
                                @AuthenticationPrincipal UserDetails principal) {
        ownershipService.checkFarmerOwnership(farmerId, principal.getUsername());
        return farmerService.updateProfile(farmerId, request);
    }

    /** Public read — any authenticated farmer may view produce listings. */
    @GetMapping("/{farmerId}/produce")
    public List<FarmerProduce> listProduce(@PathVariable Long farmerId) {
        return farmerService.listProduce(farmerId);
    }

    /** Ownership-protected: only the farmer who owns this profile may add produce. */
    @PostMapping("/{farmerId}/produce")
    @ResponseStatus(HttpStatus.CREATED)
    public FarmerProduce addProduce(@PathVariable Long farmerId,
                                    @Valid @RequestBody ProduceRequest request,
                                    @AuthenticationPrincipal UserDetails principal) {
        ownershipService.checkFarmerOwnership(farmerId, principal.getUsername());
        return farmerService.addProduce(farmerId, request);
    }

    /** Ownership-protected: only the farmer who created this listing may delete it. */
    @DeleteMapping("/produce/{produceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduce(@PathVariable Long produceId,
                               @AuthenticationPrincipal UserDetails principal) {
        ownershipService.checkProduceOwnership(produceId, principal.getUsername());
        farmerService.deleteProduce(produceId);
    }
}
