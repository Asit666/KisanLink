package com.kisanlink.controller;

import com.kisanlink.dto.BuyerRequirementRequest;
import com.kisanlink.dto.BuyerProfileRequest;
import com.kisanlink.entity.Buyer;
import com.kisanlink.entity.BuyerRequirement;
import com.kisanlink.service.BuyerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buyers")
public class BuyerController {
    private final BuyerService buyerService;

    public BuyerController(BuyerService buyerService) {
        this.buyerService = buyerService;
    }

    @GetMapping("/{buyerId}")
    public Buyer getProfile(@PathVariable Long buyerId) {
        return buyerService.getProfile(buyerId);
    }

    @PutMapping("/{buyerId}")
    public Buyer updateProfile(@PathVariable Long buyerId,
                               @RequestBody BuyerProfileRequest request) {
        return buyerService.updateProfile(buyerId, request);
    }

    @GetMapping("/{buyerId}/requirements")
    public List<BuyerRequirement> listRequirements(@PathVariable Long buyerId) {
        return buyerService.listRequirements(buyerId);
    }

    @PostMapping("/{buyerId}/requirements")
    @ResponseStatus(HttpStatus.CREATED)
    public BuyerRequirement addRequirement(@PathVariable Long buyerId,
                                           @Valid @RequestBody BuyerRequirementRequest request) {
        return buyerService.addRequirement(buyerId, request);
    }

    @DeleteMapping("/requirements/{requirementId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRequirement(@PathVariable Long requirementId) {
        buyerService.deleteRequirement(requirementId);
    }
}
