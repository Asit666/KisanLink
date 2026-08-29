package com.kisanlink.service;

import com.kisanlink.dto.TradeDealRequest;
import com.kisanlink.dto.TradeDealResponse;
import com.kisanlink.entity.*;
import com.kisanlink.repository.*;
import com.kisanlink.security.OwnershipService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class TradeDealService {

    private final TradeDealRepository tradeDealRepository;
    private final FarmerRepository farmerRepository;
    private final BuyerRepository buyerRepository;
    private final CropRepository cropRepository;
    private final FarmerProduceRepository produceRepository;
    private final BuyerRequirementRepository requirementRepository;
    private final OwnershipService ownershipService;
    private final NotificationWebSocketService notificationWebSocketService;
    private final SmsWhatsAppService smsWhatsAppService;

    public TradeDealService(TradeDealRepository tradeDealRepository,
                            FarmerRepository farmerRepository,
                            BuyerRepository buyerRepository,
                            CropRepository cropRepository,
                            FarmerProduceRepository produceRepository,
                            BuyerRequirementRepository requirementRepository,
                            OwnershipService ownershipService,
                            NotificationWebSocketService notificationWebSocketService,
                            SmsWhatsAppService smsWhatsAppService) {
        this.tradeDealRepository = tradeDealRepository;
        this.farmerRepository = farmerRepository;
        this.buyerRepository = buyerRepository;
        this.cropRepository = cropRepository;
        this.produceRepository = produceRepository;
        this.requirementRepository = requirementRepository;
        this.ownershipService = ownershipService;
        this.notificationWebSocketService = notificationWebSocketService;
        this.smsWhatsAppService = smsWhatsAppService;
    }

    public TradeDealResponse createDeal(TradeDealRequest request, String initiatorEmail, Role initiatorRole) {
        Farmer farmer = farmerRepository.findById(request.farmerId())
                .orElseThrow(() -> new IllegalArgumentException("Farmer not found: " + request.farmerId()));
        Buyer buyer = buyerRepository.findById(request.buyerId())
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found: " + request.buyerId()));

        if (initiatorRole == Role.FARMER) {
            ownershipService.checkFarmerOwnership(farmer.getId(), initiatorEmail);
        } else if (initiatorRole == Role.BUYER) {
            ownershipService.checkBuyerOwnership(buyer.getId(), initiatorEmail);
        }

        FarmerProduce produce = null;
        if (request.produceId() != null) {
            produce = produceRepository.findById(request.produceId()).orElse(null);
            if (produce != null) {
                if (!produce.getFarmer().getId().equals(farmer.getId())) {
                    throw new IllegalArgumentException("Produce listing #" + request.produceId() + " does not belong to Farmer #" + farmer.getId());
                }
                BigDecimal reservedQuantity = tradeDealRepository.findByFarmerIdOrderByCreatedAtDesc(farmer.getId()).stream()
                        .filter(d -> d.getProduce() != null && d.getProduce().getId().equals(request.produceId()))
                        .filter(d -> d.getStatus() != TradeStatus.CANCELLED)
                        .map(TradeDeal::getQuantity)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalDemanded = reservedQuantity.add(request.quantity());
                if (totalDemanded.compareTo(produce.getQuantity()) > 0) {
                    BigDecimal available = produce.getQuantity().subtract(reservedQuantity);
                    if (available.compareTo(BigDecimal.ZERO) < 0) available = BigDecimal.ZERO;
                    throw new IllegalArgumentException(String.format("Requested trade quantity %s kg exceeds available unreserved produce inventory %s kg (%s kg already locked in active deals).",
                            request.quantity().stripTrailingZeros().toPlainString(),
                            available.stripTrailingZeros().toPlainString(),
                            reservedQuantity.stripTrailingZeros().toPlainString()));
                }
            }
        }


        BuyerRequirement requirement = null;
        if (request.requirementId() != null) {
            requirement = requirementRepository.findById(request.requirementId()).orElse(null);
            if (requirement != null) {
                if (!requirement.getBuyer().getId().equals(buyer.getId())) {
                    throw new IllegalArgumentException("Procurement requirement #" + request.requirementId() + " does not belong to Buyer #" + buyer.getId());
                }
                if (request.quantity().compareTo(requirement.getRequiredQuantity()) > 0) {
                    throw new IllegalArgumentException(String.format("Requested trade quantity %s kg exceeds buyer required quantity %s kg.",
                            request.quantity().stripTrailingZeros().toPlainString(),
                            requirement.getRequiredQuantity().stripTrailingZeros().toPlainString()));
                }
            }
        }

        Crop crop = null;
        if (request.cropId() != null) {
            crop = cropRepository.findById(request.cropId()).orElse(null);
        }
        if (crop == null && produce != null) {
            crop = produce.getCrop();
        }
        if (crop == null && requirement != null) {
            crop = requirement.getCrop();
        }
        if (crop == null) {
            throw new IllegalArgumentException("A valid Crop must be specified or associated with produce/requirement.");
        }

        if (produce != null && produce.getCrop() != null && !produce.getCrop().getId().equals(crop.getId())) {
            throw new IllegalArgumentException("Produce crop (" + produce.getCrop().getName() + ") does not match deal crop (" + crop.getName() + ").");
        }
        if (requirement != null && requirement.getCrop() != null && !requirement.getCrop().getId().equals(crop.getId())) {
            throw new IllegalArgumentException("Requirement crop (" + requirement.getCrop().getName() + ") does not match deal crop (" + crop.getName() + ").");
        }

        BigDecimal transportCost = request.transportCost() != null ? request.transportCost() : BigDecimal.ZERO;
        if (transportCost.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Transport cost cannot be negative.");
        }

        BigDecimal totalAmount = request.agreedPricePerKg().multiply(request.quantity());
        BigDecimal netFarmerReturn = totalAmount.subtract(transportCost);

        TradeDeal deal = new TradeDeal();
        deal.setFarmer(farmer);
        deal.setBuyer(buyer);
        deal.setCrop(crop);
        deal.setProduce(produce);
        deal.setRequirement(requirement);
        deal.setQuantity(request.quantity());
        deal.setAgreedPricePerKg(request.agreedPricePerKg());
        deal.setTransportCost(transportCost);
        deal.setTotalAmount(totalAmount);
        deal.setNetFarmerReturn(netFarmerReturn);
        // Initial lifecycle state is strictly server-governed as PROPOSED
        deal.setStatus(TradeStatus.PROPOSED);
        deal.setInitiatedBy(initiatorRole);
        deal.setDeliveryAddress(request.deliveryAddress() != null ? request.deliveryAddress() : buyer.getAddress());
        deal.setNotes(request.notes());

        TradeDeal saved = tradeDealRepository.save(deal);


        // Real-time notification dispatch
        User targetUser = (initiatorRole == Role.FARMER) ? buyer.getUser() : farmer.getUser();
        String senderName = (initiatorRole == Role.FARMER) ? farmer.getUser().getName() : (buyer.getBusinessName() != null ? buyer.getBusinessName() : buyer.getUser().getName());
        String notifMsg = String.format("%s proposed a trade deal for %s kg %s at ₹%s/kg.",
                senderName,
                saved.getQuantity().stripTrailingZeros().toPlainString(),
                saved.getCrop().getName(),
                saved.getAgreedPricePerKg().stripTrailingZeros().toPlainString());

        notificationWebSocketService.sendUserNotification(targetUser, "TRADE_PROPOSED", "New Trade Proposal: " + saved.getCrop().getName(), notifMsg, saved.getId(), saved.getStatus().name());
        notificationWebSocketService.sendTradeUpdate(farmer.getUser(), saved, "Trade proposed");
        notificationWebSocketService.sendTradeUpdate(buyer.getUser(), saved, "Trade proposed");

        // Dispatch field SMS to target user
        String smsBody = String.format("[KisanLink Alert] %s. Reply 'ACCEPT %d' to confirm deal directly via SMS.", notifMsg, saved.getId());
        smsWhatsAppService.dispatchAlert(targetUser, targetUser.getPhone(), MessageChannel.SMS, "TRADE_PROPOSED", smsBody);

        return mapToResponse(saved);
    }

    public TradeDealResponse updateTradeStatus(Long dealId, TradeStatus newStatus, String userEmail) {
        TradeDeal deal = tradeDealRepository.findById(dealId)
                .orElseThrow(() -> new IllegalArgumentException("Trade deal not found: " + dealId));

        ownershipService.checkTradeDealAccess(deal, userEmail);
        validateStatusTransition(deal.getStatus(), newStatus);

        boolean isFarmer = deal.getFarmer() != null && deal.getFarmer().getUser().getEmail().equalsIgnoreCase(userEmail);
        boolean isBuyer = deal.getBuyer() != null && deal.getBuyer().getUser().getEmail().equalsIgnoreCase(userEmail);
        Role actorRole = isFarmer ? Role.FARMER : (isBuyer ? Role.BUYER : Role.ADMIN);

        if (newStatus == TradeStatus.ACCEPTED) {
            Role lastSender = deal.getNegotiations().isEmpty() ? deal.getInitiatedBy() : deal.getNegotiations().get(deal.getNegotiations().size() - 1).getSenderRole();
            if (actorRole == lastSender) {
                throw new IllegalStateException("You cannot accept your own trade proposal or counter-offer.");
            }
        }

        if (newStatus == TradeStatus.COMPLETED && actorRole != Role.BUYER && actorRole != Role.ADMIN) {
            throw new IllegalStateException("Only the buyer can mark a trade deal as COMPLETED.");
        }

        deal.setStatus(newStatus);
        TradeDeal updated = tradeDealRepository.save(deal);

        // Real-time notification to both parties
        String actionTitle = (newStatus == TradeStatus.ACCEPTED)
                ? "Trade Deal #" + deal.getId() + " Accepted!"
                : "Trade Deal #" + deal.getId() + " Status: " + newStatus;
        String actionMsg = String.format("Deal terms for %s kg %s updated to status %s.",
                deal.getQuantity().stripTrailingZeros().toPlainString(),
                deal.getCrop().getName(),
                newStatus);

        notificationWebSocketService.sendUserNotification(deal.getFarmer().getUser(), "TRADE_STATUS_CHANGED", actionTitle, actionMsg, deal.getId(), newStatus.name());
        notificationWebSocketService.sendUserNotification(deal.getBuyer().getUser(), "TRADE_STATUS_CHANGED", actionTitle, actionMsg, deal.getId(), newStatus.name());
        notificationWebSocketService.sendTradeUpdate(deal.getFarmer().getUser(), updated, "Status updated to " + newStatus);
        notificationWebSocketService.sendTradeUpdate(deal.getBuyer().getUser(), updated, "Status updated to " + newStatus);

        return mapToResponse(updated);
    }

    public TradeDealResponse submitCounterOffer(Long dealId, com.kisanlink.dto.CounterOfferRequest request, String userEmail, Role userRole) {
        TradeDeal deal = tradeDealRepository.findById(dealId)
                .orElseThrow(() -> new IllegalArgumentException("Trade deal not found: " + dealId));

        ownershipService.checkTradeDealAccess(deal, userEmail);

        if (deal.getStatus() != TradeStatus.PROPOSED && deal.getStatus() != TradeStatus.NEGOTIATING) {
            throw new IllegalStateException("Cannot negotiate terms on a " + deal.getStatus() + " trade deal.");
        }

        Role lastSender = deal.getNegotiations().isEmpty() ? deal.getInitiatedBy() : deal.getNegotiations().get(deal.getNegotiations().size() - 1).getSenderRole();
        if (userRole == lastSender) {
            throw new IllegalStateException("It is not your turn to submit a counter-offer. Please wait for the counterparty response.");
        }


        deal.setAgreedPricePerKg(request.proposedPricePerKg());
        deal.setQuantity(request.proposedQuantity());
        BigDecimal totalAmount = request.proposedPricePerKg().multiply(request.proposedQuantity());
        deal.setTotalAmount(totalAmount);
        deal.setNetFarmerReturn(totalAmount.subtract(deal.getTransportCost()));
        deal.setStatus(TradeStatus.NEGOTIATING);

        String senderName = (userRole == Role.BUYER)
                ? (deal.getBuyer().getBusinessName() != null ? deal.getBuyer().getBusinessName() : deal.getBuyer().getUser().getName())
                : deal.getFarmer().getUser().getName();

        TradeNegotiation negotiation = new TradeNegotiation();
        negotiation.setTradeDeal(deal);
        negotiation.setSenderRole(userRole);
        negotiation.setSenderName(senderName);
        negotiation.setProposedPricePerKg(request.proposedPricePerKg());
        negotiation.setProposedQuantity(request.proposedQuantity());
        negotiation.setMessage(request.message());

        deal.getNegotiations().add(negotiation);
        TradeDeal saved = tradeDealRepository.save(deal);

        // Real-time counter-offer notification to opposite party
        User recipient = (userRole == Role.BUYER) ? deal.getFarmer().getUser() : deal.getBuyer().getUser();
        String counterTitle = "Counter-Offer on Deal #" + deal.getId();
        String counterMsg = String.format("%s counter-offered ₹%s/kg for %s kg.",
                senderName,
                request.proposedPricePerKg().stripTrailingZeros().toPlainString(),
                request.proposedQuantity().stripTrailingZeros().toPlainString());

        notificationWebSocketService.sendUserNotification(recipient, "TRADE_NEGOTIATING", counterTitle, counterMsg, deal.getId(), TradeStatus.NEGOTIATING.name());
        notificationWebSocketService.sendTradeUpdate(deal.getFarmer().getUser(), saved, "Counter-offer: ₹" + request.proposedPricePerKg() + "/kg");
        notificationWebSocketService.sendTradeUpdate(deal.getBuyer().getUser(), saved, "Counter-offer: ₹" + request.proposedPricePerKg() + "/kg");

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public TradeDealResponse getDealById(Long dealId, String userEmail) {
        TradeDeal deal = tradeDealRepository.findById(dealId)
                .orElseThrow(() -> new IllegalArgumentException("Trade deal not found: " + dealId));
        ownershipService.checkTradeDealAccess(deal, userEmail);
        return mapToResponse(deal);
    }

    @Transactional(readOnly = true)
    public List<TradeDealResponse> getFarmerDeals(Long farmerId, String userEmail) {
        ownershipService.checkFarmerOwnership(farmerId, userEmail);
        return tradeDealRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TradeDealResponse> getBuyerDeals(Long buyerId, String userEmail) {
        ownershipService.checkBuyerOwnership(buyerId, userEmail);
        return tradeDealRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private void validateStatusTransition(TradeStatus current, TradeStatus target) {
        if (current == target) {
            return;
        }
        if (current == TradeStatus.COMPLETED || current == TradeStatus.CANCELLED) {
            throw new IllegalStateException("Cannot change status of a " + current + " trade deal.");
        }
        boolean valid = switch (current) {
            case PROPOSED -> target == TradeStatus.NEGOTIATING || target == TradeStatus.ACCEPTED || target == TradeStatus.CANCELLED;
            case NEGOTIATING -> target == TradeStatus.ACCEPTED || target == TradeStatus.CANCELLED;
            case ACCEPTED -> target == TradeStatus.IN_TRANSIT || target == TradeStatus.CANCELLED;
            case IN_TRANSIT -> target == TradeStatus.DELIVERED || target == TradeStatus.CANCELLED;
            case DELIVERED -> target == TradeStatus.COMPLETED;
            default -> false;
        };
        if (!valid) {
            throw new IllegalStateException(String.format("Invalid status transition from %s to %s", current, target));
        }
    }


    private TradeDealResponse mapToResponse(TradeDeal deal) {
        List<com.kisanlink.dto.TradeNegotiationResponse> negResponses = (deal.getNegotiations() != null)
                ? deal.getNegotiations().stream()
                .map(n -> new com.kisanlink.dto.TradeNegotiationResponse(
                        n.getId(),
                        n.getSenderRole(),
                        n.getSenderName(),
                        n.getProposedPricePerKg(),
                        n.getProposedQuantity(),
                        n.getMessage(),
                        n.getCreatedAt()
                )).toList()
                : List.of();

        return new TradeDealResponse(
                deal.getId(),
                deal.getFarmer().getId(),
                deal.getFarmer().getUser().getName(),
                deal.getFarmer().getDistrict(),
                deal.getBuyer().getId(),
                deal.getBuyer().getBusinessName() != null ? deal.getBuyer().getBusinessName() : deal.getBuyer().getUser().getName(),
                deal.getBuyer().getBusinessType(),
                deal.getCrop().getId(),
                deal.getCrop().getName(),
                deal.getCrop().getCategory() != null ? deal.getCrop().getCategory().name() : null,
                deal.getProduce() != null ? deal.getProduce().getId() : null,
                deal.getProduce() != null ? deal.getProduce().getImageUrl() : null,
                deal.getRequirement() != null ? deal.getRequirement().getId() : null,
                deal.getQuantity(),
                deal.getAgreedPricePerKg(),
                deal.getTransportCost(),
                deal.getTotalAmount(),
                deal.getNetFarmerReturn(),
                deal.getStatus(),
                deal.getInitiatedBy(),
                deal.getDeliveryAddress(),
                deal.getNotes(),
                negResponses,
                deal.getCreatedAt(),
                deal.getUpdatedAt()
        );
    }
}
