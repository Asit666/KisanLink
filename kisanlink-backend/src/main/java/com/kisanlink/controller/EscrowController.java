package com.kisanlink.controller;

import com.kisanlink.dto.*;
import com.kisanlink.service.EscrowService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/escrow")
public class EscrowController {

    private final EscrowService escrowService;

    public EscrowController(EscrowService escrowService) {
        this.escrowService = escrowService;
    }

    @PostMapping("/initiate/{dealId}")
    public EscrowResponse initiateEscrow(@PathVariable Long dealId,
                                         @AuthenticationPrincipal UserDetails principal) {
        return escrowService.getOrCreateEscrow(dealId, principal.getUsername());
    }

    @GetMapping("/trade/{dealId}")
    public EscrowResponse getEscrowByTrade(@PathVariable Long dealId,
                                           @AuthenticationPrincipal UserDetails principal) {
        return escrowService.getOrCreateEscrow(dealId, principal.getUsername());
    }

    @PostMapping("/{escrowId}/deposit")
    public EscrowResponse depositFunds(@PathVariable Long escrowId,
                                       @Valid @RequestBody EscrowDepositRequest request,
                                       @AuthenticationPrincipal UserDetails principal) {
        return escrowService.depositFunds(escrowId, request, principal.getUsername());
    }

    @PostMapping("/{escrowId}/release")
    public EscrowResponse releaseFunds(@PathVariable Long escrowId,
                                       @RequestBody(required = false) EscrowReleaseRequest request,
                                       @AuthenticationPrincipal UserDetails principal) {
        EscrowReleaseRequest req = request != null ? request : new EscrowReleaseRequest("Delivery confirmed");
        return escrowService.releaseFunds(escrowId, req, principal.getUsername());
    }

    @PostMapping("/{escrowId}/dispute")
    public EscrowResponse raiseDispute(@PathVariable Long escrowId,
                                       @Valid @RequestBody EscrowDisputeRequest request,
                                       @AuthenticationPrincipal UserDetails principal) {
        return escrowService.raiseDispute(escrowId, request, principal.getUsername());
    }
}
