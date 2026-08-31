package com.kisanlink.controller;

import com.kisanlink.dto.TradeDisputeRequest;
import com.kisanlink.entity.TradeDispute;
import com.kisanlink.service.TradeDisputeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trades")
public class TradeDisputeController {

    private final TradeDisputeService disputeService;

    public TradeDisputeController(TradeDisputeService disputeService) {
        this.disputeService = disputeService;
    }

    @PostMapping("/disputes")
    @ResponseStatus(HttpStatus.CREATED)
    public TradeDispute raiseDispute(
            @Valid @RequestBody TradeDisputeRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        return disputeService.raiseDispute(request, principal.getUsername());
    }

    @GetMapping("/{dealId}/disputes")
    public List<TradeDispute> getDisputesForDeal(
            @PathVariable Long dealId,
            @AuthenticationPrincipal UserDetails principal) {
        return disputeService.getDisputesForDeal(dealId, principal.getUsername());
    }
}
