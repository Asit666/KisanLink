package com.kisanlink.controller;

import com.kisanlink.entity.DealOffer;
import com.kisanlink.entity.Dispute;
import com.kisanlink.entity.User;
import com.kisanlink.repository.DealOfferRepository;
import com.kisanlink.repository.DisputeRepository;
import com.kisanlink.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/disputes")
public class DisputeController {

    private final DisputeRepository disputeRepository;
    private final DealOfferRepository dealOfferRepository;
    private final UserRepository userRepository;

    public DisputeController(DisputeRepository disputeRepository, DealOfferRepository dealOfferRepository, UserRepository userRepository) {
        this.disputeRepository = disputeRepository;
        this.dealOfferRepository = dealOfferRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/deal/{dealId}/user/{userId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Dispute createDispute(@PathVariable Long dealId, @PathVariable Long userId, @RequestBody Dispute disputeRequest) {
        DealOffer deal = dealOfferRepository.findById(dealId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deal not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        disputeRequest.setDeal(deal);
        disputeRequest.setRaisedByUser(user);
        return disputeRepository.save(disputeRequest);
    }

    @GetMapping("/deal/{dealId}")
    public List<Dispute> getDisputesByDeal(@PathVariable Long dealId) {
        return disputeRepository.findByDealId(dealId);
    }

    @GetMapping
    public List<Dispute> getAllDisputes() {
        return disputeRepository.findAll();
    }

    @PutMapping("/{disputeId}/status")
    public Dispute updateDisputeStatus(@PathVariable Long disputeId, @RequestBody Dispute statusRequest) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dispute not found"));
        dispute.setStatus(statusRequest.getStatus());
        return disputeRepository.save(dispute);
    }
}
