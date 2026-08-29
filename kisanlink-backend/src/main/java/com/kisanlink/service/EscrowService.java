package com.kisanlink.service;

import com.kisanlink.dto.*;
import com.kisanlink.entity.*;
import com.kisanlink.repository.EscrowRepository;
import com.kisanlink.repository.TradeDealRepository;
import com.kisanlink.security.OwnershipService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;


import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
@Transactional
public class EscrowService {

    private final EscrowRepository escrowRepository;
    private final TradeDealRepository tradeDealRepository;
    private final OwnershipService ownershipService;
    private final NotificationWebSocketService notificationWebSocketService;
    private final SmsWhatsAppService smsWhatsAppService;

    public EscrowService(EscrowRepository escrowRepository,
                         TradeDealRepository tradeDealRepository,
                         OwnershipService ownershipService,
                         NotificationWebSocketService notificationWebSocketService,
                         SmsWhatsAppService smsWhatsAppService) {
        this.escrowRepository = escrowRepository;
        this.tradeDealRepository = tradeDealRepository;
        this.ownershipService = ownershipService;
        this.notificationWebSocketService = notificationWebSocketService;
        this.smsWhatsAppService = smsWhatsAppService;
    }

    @Transactional
    public EscrowResponse getOrCreateEscrow(Long dealId, String userEmail) {
        TradeDeal deal = tradeDealRepository.findById(dealId)
                .orElseThrow(() -> new IllegalArgumentException("Trade deal not found: " + dealId));
        ownershipService.checkTradeDealAccess(deal, userEmail);

        if (deal.getStatus() != TradeStatus.ACCEPTED &&
            deal.getStatus() != TradeStatus.IN_TRANSIT &&
            deal.getStatus() != TradeStatus.DELIVERED &&
            deal.getStatus() != TradeStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Escrow account cannot be opened until trade contract is ACCEPTED. Current status: " + deal.getStatus());
        }


        EscrowPayment escrow = escrowRepository.findByTradeDealId(dealId)
                .orElseGet(() -> {
                    EscrowPayment newEscrow = new EscrowPayment();
                    newEscrow.setTradeDeal(deal);
                    newEscrow.setTotalAmount(deal.getTotalAmount());
                    newEscrow.setFarmerPayout(deal.getNetFarmerReturn());
                    newEscrow.setStatus(EscrowStatus.PENDING_DEPOSIT);
                    newEscrow.setPaymentMethod(PaymentMethod.UPI_INSTANT);
                    String phone = (deal.getFarmer() != null && deal.getFarmer().getUser() != null)
                            ? deal.getFarmer().getUser().getPhone()
                            : null;
                    newEscrow.setFarmerUpiId(phone != null && !phone.isBlank() ? phone + "@upi" : "farmer@upi");
                    return escrowRepository.save(newEscrow);
                });

        return mapToResponse(escrow);
    }


    public EscrowResponse depositFunds(Long escrowId, EscrowDepositRequest request, String userEmail) {
        EscrowPayment escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow account not found: " + escrowId));

        TradeDeal deal = escrow.getTradeDeal();
        ownershipService.checkBuyerOwnership(deal.getBuyer().getId(), userEmail);

        if (escrow.getStatus() != EscrowStatus.PENDING_DEPOSIT) {
            throw new IllegalStateException("Escrow deposit already processed. Current status: " + escrow.getStatus());
        }

        if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Deposit amount must be strictly positive.");
        }

        if (request.amount().compareTo(escrow.getTotalAmount()) != 0) {
            throw new IllegalArgumentException(String.format("Deposit amount ₹%s must exactly match required deal total ₹%s",
                    request.amount().toPlainString(), escrow.getTotalAmount().toPlainString()));
        }


        String upiRef = (request.upiTransactionRef() != null && !request.upiTransactionRef().isBlank())
                ? request.upiTransactionRef()
                : "UPI/KL/" + (System.currentTimeMillis() % 1000000000L);

        escrow.setDepositAmount(request.amount());
        escrow.setPaymentMethod(request.paymentMethod() != null ? request.paymentMethod() : PaymentMethod.UPI_INSTANT);
        escrow.setBuyerUpiId(request.buyerUpiId() != null ? request.buyerUpiId() : "buyer@okaxis");
        escrow.setUpiRef(upiRef);
        escrow.setStatus(EscrowStatus.FUNDS_HELD_IN_ESCROW);
        escrow.setDepositedAt(Instant.now());

        EscrowPayment saved = escrowRepository.save(escrow);

        // Real-time notification dispatch to Farmer & Buyer
        String farmerTitle = "Payment Guaranteed in Escrow: ₹" + saved.getDepositAmount();
        String farmerMsg = String.format("Buyer locked ₹%s for Trade #%d into KisanLink Escrow Vault. Produce harvest/dispatch is 100%% protected.",
                saved.getDepositAmount().stripTrailingZeros().toPlainString(),
                deal.getId());
        notificationWebSocketService.sendUserNotification(deal.getFarmer().getUser(), "ESCROW_LOCKED", farmerTitle, farmerMsg, deal.getId(), EscrowStatus.FUNDS_HELD_IN_ESCROW.name());

        String buyerTitle = "Escrow Deposit Confirmed: ₹" + saved.getDepositAmount();
        String buyerMsg = String.format("Funds securely locked in Escrow Vault for Trade #%d. UTR Ref: %s.",
                deal.getId(),
                upiRef);
        notificationWebSocketService.sendUserNotification(deal.getBuyer().getUser(), "ESCROW_LOCKED", buyerTitle, buyerMsg, deal.getId(), EscrowStatus.FUNDS_HELD_IN_ESCROW.name());

        notificationWebSocketService.sendTradeUpdate(deal.getFarmer().getUser(), deal, "Escrow Funds Locked (₹" + saved.getDepositAmount() + ")");
        notificationWebSocketService.sendTradeUpdate(deal.getBuyer().getUser(), deal, "Escrow Funds Locked (₹" + saved.getDepositAmount() + ")");

        // Field SMS alert to Farmer confirming guaranteed payment before dispatch
        String smsText = String.format("[KisanLink Vault] ₹%s locked in Escrow for Trade #%d. You are 100%% protected. Proceed with dispatch.",
                saved.getDepositAmount().stripTrailingZeros().toPlainString(), deal.getId());
        smsWhatsAppService.dispatchAlert(deal.getFarmer().getUser(), deal.getFarmer().getUser().getPhone(), MessageChannel.WHATSAPP, "ESCROW_LOCKED", smsText);

        return mapToResponse(saved);
    }

    public EscrowResponse releaseFunds(Long escrowId, EscrowReleaseRequest request, String userEmail) {
        EscrowPayment escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow account not found: " + escrowId));

        TradeDeal deal = escrow.getTradeDeal();
        // Escrow payout release can only be authorized by the Buyer who funded the deal
        ownershipService.checkBuyerOwnership(deal.getBuyer().getId(), userEmail);

        if (escrow.getStatus() == EscrowStatus.DISPUTED) {
            throw new IllegalStateException("Escrow funds are frozen under DISPUTED status. Resolution required before funds can be released.");
        }

        if (escrow.getStatus() != EscrowStatus.FUNDS_HELD_IN_ESCROW) {
            throw new IllegalStateException("Cannot release funds when escrow status is " + escrow.getStatus());
        }

        String settlementUtr = "UTR-NPCI-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        escrow.setStatus(EscrowStatus.RELEASED_TO_FARMER);
        escrow.setSettlementUtr(settlementUtr);
        escrow.setReleasedAt(Instant.now());

        if (deal.getStatus() != TradeStatus.COMPLETED) {
            deal.setStatus(TradeStatus.COMPLETED);
            tradeDealRepository.save(deal);
        }

        EscrowPayment saved = escrowRepository.save(escrow);

        // Real-time payout dispatch notifications
        String farmerTitle = "Payout Settled! ₹" + saved.getFarmerPayout() + " Transferred";
        String farmerMsg = String.format("Escrow payment for Trade #%d successfully deposited to your UPI ID %s. Settlement UTR: %s.",
                deal.getId(),
                saved.getFarmerUpiId() != null ? saved.getFarmerUpiId() : "Registered Account",
                settlementUtr);
        notificationWebSocketService.sendUserNotification(deal.getFarmer().getUser(), "PAYOUT_SETTLED", farmerTitle, farmerMsg, deal.getId(), EscrowStatus.RELEASED_TO_FARMER.name());

        String buyerTitle = "Trade Deal #" + deal.getId() + " Completed & Settled";
        String buyerMsg = String.format("Escrow payout settled with Farmer. Deal closed successfully. UTR: %s.", settlementUtr);
        notificationWebSocketService.sendUserNotification(deal.getBuyer().getUser(), "PAYOUT_SETTLED", buyerTitle, buyerMsg, deal.getId(), EscrowStatus.RELEASED_TO_FARMER.name());

        notificationWebSocketService.sendTradeUpdate(deal.getFarmer().getUser(), deal, "Payout Settled (UTR: " + settlementUtr + ")");
        notificationWebSocketService.sendTradeUpdate(deal.getBuyer().getUser(), deal, "Payout Settled (UTR: " + settlementUtr + ")");

        // Field SMS alert to Farmer with instant settlement UTR receipt
        String payoutSms = String.format("[KisanLink Payout] ₹%s credited to your UPI account for Trade #%d. UTR Ref: %s. Deal completed.",
                saved.getFarmerPayout().stripTrailingZeros().toPlainString(), deal.getId(), settlementUtr);
        smsWhatsAppService.dispatchAlert(deal.getFarmer().getUser(), deal.getFarmer().getUser().getPhone(), MessageChannel.SMS, "PAYOUT_SETTLED", payoutSms);

        return mapToResponse(saved);
    }


    public EscrowResponse raiseDispute(Long escrowId, EscrowDisputeRequest request, String userEmail) {
        EscrowPayment escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow account not found: " + escrowId));

        TradeDeal deal = escrow.getTradeDeal();
        ownershipService.checkTradeDealAccess(deal, userEmail);

        escrow.setStatus(EscrowStatus.DISPUTED);
        escrow.setDisputeReason(request.reason());
        EscrowPayment saved = escrowRepository.save(escrow);

        String disputeTitle = "Escrow Dispute Raised on Trade #" + deal.getId();
        String disputeMsg = "Dispute flagged: " + request.reason() + ". Escrow funds remain safely frozen until resolution.";
        notificationWebSocketService.sendUserNotification(deal.getFarmer().getUser(), "ESCROW_DISPUTED", disputeTitle, disputeMsg, deal.getId(), EscrowStatus.DISPUTED.name());
        notificationWebSocketService.sendUserNotification(deal.getBuyer().getUser(), "ESCROW_DISPUTED", disputeTitle, disputeMsg, deal.getId(), EscrowStatus.DISPUTED.name());

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public EscrowResponse getEscrowByTradeId(Long dealId, String userEmail) {
        TradeDeal deal = tradeDealRepository.findById(dealId)
                .orElseThrow(() -> new IllegalArgumentException("Trade deal not found: " + dealId));
        ownershipService.checkTradeDealAccess(deal, userEmail);

        EscrowPayment escrow = escrowRepository.findByTradeDealId(dealId)
                .orElseThrow(() -> new IllegalArgumentException("No escrow account found for Trade #" + dealId));
        return mapToResponse(escrow);
    }

    private EscrowResponse mapToResponse(EscrowPayment e) {
        return new EscrowResponse(
                e.getId(),
                e.getTradeDeal().getId(),
                e.getTotalAmount(),
                e.getDepositAmount(),
                e.getFarmerPayout(),
                e.getStatus(),
                e.getPaymentMethod(),
                e.getUpiRef(),
                e.getFarmerUpiId(),
                e.getBuyerUpiId(),
                e.getSettlementUtr(),
                e.getDisputeReason(),
                e.getDepositedAt(),
                e.getReleasedAt(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
