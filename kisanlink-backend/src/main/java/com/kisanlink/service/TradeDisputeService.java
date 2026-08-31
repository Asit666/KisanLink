package com.kisanlink.service;

import com.kisanlink.dto.TradeDisputeRequest;
import com.kisanlink.entity.TradeDeal;
import com.kisanlink.entity.TradeDispute;
import com.kisanlink.entity.User;
import com.kisanlink.repository.TradeDealRepository;
import com.kisanlink.repository.TradeDisputeRepository;
import com.kisanlink.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class TradeDisputeService {

    private final TradeDisputeRepository disputeRepo;
    private final TradeDealRepository dealRepo;
    private final UserRepository userRepo;

    public TradeDisputeService(TradeDisputeRepository disputeRepo, TradeDealRepository dealRepo, UserRepository userRepo) {
        this.disputeRepo = disputeRepo;
        this.dealRepo = dealRepo;
        this.userRepo = userRepo;
    }

    @Transactional
    public TradeDispute raiseDispute(TradeDisputeRequest req, String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        TradeDeal deal = dealRepo.findById(req.tradeDealId())
                .orElseThrow(() -> new IllegalArgumentException("Trade deal not found: " + req.tradeDealId()));

        boolean isFarmer = deal.getFarmer().getUser().getId().equals(user.getId());
        boolean isBuyer = deal.getBuyer().getUser().getId().equals(user.getId());

        if (!isFarmer && !isBuyer) {
            throw new SecurityException("Only trade participants can raise a dispute on this deal");
        }

        TradeDispute dispute = new TradeDispute();
        dispute.setTradeDeal(deal);
        dispute.setRaisedByUser(user);
        dispute.setRaisedByRole(isFarmer ? "FARMER" : "BUYER");
        dispute.setDisputeType(req.disputeType());
        dispute.setDescription(req.description());
        dispute.setClaimAmount(req.claimAmount() != null ? req.claimAmount() : BigDecimal.ZERO);
        dispute.setStatus("OPEN");
        dispute.setCreatedAt(Instant.now());

        return disputeRepo.save(dispute);
    }

    @Transactional(readOnly = true)
    public List<TradeDispute> getDisputesForDeal(Long dealId, String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        TradeDeal deal = dealRepo.findById(dealId)
                .orElseThrow(() -> new IllegalArgumentException("Deal not found"));

        boolean isFarmer = deal.getFarmer().getUser().getId().equals(user.getId());
        boolean isBuyer = deal.getBuyer().getUser().getId().equals(user.getId());

        if (!isFarmer && !isBuyer) {
            throw new SecurityException("Access denied");
        }

        return disputeRepo.findByTradeDealIdOrderByCreatedAtDesc(dealId);
    }
}
