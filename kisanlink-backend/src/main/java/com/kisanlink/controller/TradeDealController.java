package com.kisanlink.controller;

import com.kisanlink.dto.TradeDealRequest;
import com.kisanlink.dto.TradeDealResponse;
import com.kisanlink.entity.Role;
import com.kisanlink.entity.TradeStatus;
import com.kisanlink.service.TradeDealService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trades")
public class TradeDealController {

    private final TradeDealService tradeDealService;

    public TradeDealController(TradeDealService tradeDealService) {
        this.tradeDealService = tradeDealService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TradeDealResponse createDeal(@Valid @RequestBody TradeDealRequest request,
                                        @AuthenticationPrincipal UserDetails principal) {
        Role role = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_BUYER")) ? Role.BUYER : Role.FARMER;
        return tradeDealService.createDeal(request, principal.getUsername(), role);
    }

    @GetMapping("/{tradeId}")
    public TradeDealResponse getDealById(@PathVariable Long tradeId,
                                         @AuthenticationPrincipal UserDetails principal) {
        return tradeDealService.getDealById(tradeId, principal.getUsername());
    }

    @GetMapping("/farmer/{farmerId}")
    public List<TradeDealResponse> getFarmerDeals(@PathVariable Long farmerId,
                                                 @AuthenticationPrincipal UserDetails principal) {
        return tradeDealService.getFarmerDeals(farmerId, principal.getUsername());
    }

    @GetMapping("/buyer/{buyerId}")
    public List<TradeDealResponse> getBuyerDeals(@PathVariable Long buyerId,
                                               @AuthenticationPrincipal UserDetails principal) {
        return tradeDealService.getBuyerDeals(buyerId, principal.getUsername());
    }

    @PatchMapping("/{tradeId}/status")
    public TradeDealResponse updateStatus(@PathVariable Long tradeId,
                                          @RequestBody Map<String, String> body,
                                          @AuthenticationPrincipal UserDetails principal) {
        String statusStr = body.get("status");
        if (statusStr == null || statusStr.isBlank()) {
            throw new IllegalArgumentException("Status field is required.");
        }
        TradeStatus status = TradeStatus.valueOf(statusStr.toUpperCase());
        return tradeDealService.updateTradeStatus(tradeId, status, principal.getUsername());
    }

    @PostMapping("/{tradeId}/negotiate")
    public TradeDealResponse submitCounterOffer(@PathVariable Long tradeId,
                                                @Valid @RequestBody com.kisanlink.dto.CounterOfferRequest request,
                                                @AuthenticationPrincipal UserDetails principal) {
        Role role = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_BUYER")) ? Role.BUYER : Role.FARMER;
        return tradeDealService.submitCounterOffer(tradeId, request, principal.getUsername(), role);
    }
}
