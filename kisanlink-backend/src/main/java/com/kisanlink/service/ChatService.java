package com.kisanlink.service;

import com.kisanlink.dto.RespondOfferRequest;
import com.kisanlink.dto.SendChatMessageRequest;
import com.kisanlink.dto.SendTradeOfferRequest;
import com.kisanlink.dto.StartConversationRequest;
import com.kisanlink.entity.*;
import com.kisanlink.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final FarmerRepository farmerRepository;
    private final BuyerRepository buyerRepository;
    private final CropRepository cropRepository;
    private final TradeDealRepository tradeDealRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatService(ChatConversationRepository conversationRepository,
                       ChatMessageRepository messageRepository,
                       FarmerRepository farmerRepository,
                       BuyerRepository buyerRepository,
                       CropRepository cropRepository,
                       TradeDealRepository tradeDealRepository,
                       UserRepository userRepository,
                       SimpMessagingTemplate messagingTemplate) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.farmerRepository = farmerRepository;
        this.buyerRepository = buyerRepository;
        this.cropRepository = cropRepository;
        this.tradeDealRepository = tradeDealRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public List<ChatConversation> getConversationsForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        if (user.getRole() == Role.FARMER) {
            Farmer farmer = farmerRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Farmer profile not found for user: " + userEmail));
            return conversationRepository.findByFarmerIdOrderByLastMessageAtDesc(farmer.getId());
        } else if (user.getRole() == Role.BUYER) {
            Buyer buyer = buyerRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Buyer profile not found for user: " + userEmail));
            return conversationRepository.findByBuyerIdOrderByLastMessageAtDesc(buyer.getId());
        } else {
            return List.of();
        }
    }

    public ChatConversation startOrGetConversation(StartConversationRequest req, String userEmail) {
        Farmer farmer = farmerRepository.findById(req.farmerId())
                .orElseThrow(() -> new IllegalArgumentException("Farmer not found: " + req.farmerId()));
        Buyer buyer = buyerRepository.findById(req.buyerId())
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found: " + req.buyerId()));

        String cropName = req.cropName() != null ? req.cropName().trim() : "General Trade";

        Optional<ChatConversation> existing = conversationRepository
                .findByFarmerIdAndBuyerIdAndCropNameIgnoreCase(farmer.getId(), buyer.getId(), cropName);

        if (existing.isPresent()) {
            return existing.get();
        }

        ChatConversation conv = new ChatConversation();
        conv.setFarmerId(farmer.getId());
        conv.setBuyerId(buyer.getId());
        conv.setFarmerName(farmer.getUser().getName());
        conv.setBuyerName(buyer.getUser().getName());
        conv.setCropName(cropName);
        conv.setTradeDealId(req.tradeDealId());
        conv.setLastMessageText("Conversation started for " + cropName);
        conv.setLastMessageAt(Instant.now());
        conv.setCreatedAt(Instant.now());

        ChatConversation saved = conversationRepository.save(conv);
        log.info("Created new trade conversation #{} between Farmer #{} and Buyer #{}", saved.getId(), farmer.getId(), buyer.getId());
        return saved;
    }

    public List<ChatMessage> getMessages(Long conversationId, String userEmail) {
        ChatConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));

        validateUserAccess(conv, userEmail);

        return messageRepository.findByConversationIdOrderBySentAtAsc(conversationId);
    }

    public ChatMessage sendTextMessage(Long conversationId, SendChatMessageRequest req, String userEmail) {
        ChatConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));

        User user = validateUserAccess(conv, userEmail);

        ChatMessage msg = new ChatMessage();
        msg.setConversationId(conv.getId());
        msg.setSenderRole(user.getRole().name());
        msg.setSenderId(user.getId());
        msg.setSenderName(user.getName());
        msg.setMessageText(req.messageText());
        msg.setOffer(false);
        msg.setSentAt(Instant.now());

        ChatMessage saved = messageRepository.save(msg);

        conv.setLastMessageText(req.messageText());
        conv.setLastMessageAt(Instant.now());
        conversationRepository.save(conv);

        broadcastMessage(conv, saved);
        return saved;
    }

    public ChatMessage sendTradeOffer(Long conversationId, SendTradeOfferRequest req, String userEmail) {
        ChatConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + conversationId));

        User user = validateUserAccess(conv, userEmail);

        BigDecimal total = req.quantityKg().multiply(req.pricePerKg());

        ChatMessage msg = new ChatMessage();
        msg.setConversationId(conv.getId());
        msg.setSenderRole(user.getRole().name());
        msg.setSenderId(user.getId());
        msg.setSenderName(user.getName());
        msg.setOffer(true);
        msg.setOfferCropName(req.cropName());
        msg.setOfferQuantityKg(req.quantityKg());
        msg.setOfferPricePerKg(req.pricePerKg());
        msg.setOfferTotalAmount(total);
        msg.setOfferStatus("PENDING");

        String offerText = "Trade Offer: " + req.quantityKg() + " kg of " + req.cropName() + " at INR " + req.pricePerKg() + "/kg (Total: INR " + total + ")";
        if (req.note() != null && !req.note().isBlank()) {
            offerText += ". Note: " + req.note().trim();
        }
        msg.setMessageText(offerText);
        msg.setSentAt(Instant.now());

        ChatMessage saved = messageRepository.save(msg);

        conv.setLastMessageText("Trade Offer: INR " + total + " for " + req.quantityKg() + " kg " + req.cropName());
        conv.setLastMessageAt(Instant.now());
        conversationRepository.save(conv);

        broadcastMessage(conv, saved);
        return saved;
    }

    public ChatMessage respondToOffer(Long messageId, RespondOfferRequest req, String userEmail) {
        ChatMessage offerMsg = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Offer message not found: " + messageId));

        if (!offerMsg.isOffer()) {
            throw new IllegalArgumentException("Message #" + messageId + " is not a trade offer.");
        }

        ChatConversation conv = conversationRepository.findById(offerMsg.getConversationId())
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found for message: " + messageId));

        User user = validateUserAccess(conv, userEmail);

        // Disallow accepting own offer
        if (offerMsg.getSenderRole().equalsIgnoreCase(user.getRole().name())) {
            throw new IllegalArgumentException("You cannot respond to your own trade offer.");
        }

        String action = req.action().toUpperCase();
        if ("ACCEPT".equals(action)) {
            offerMsg.setOfferStatus("ACCEPTED");
            messageRepository.save(offerMsg);

            // Establish or link TradeDeal
            TradeDeal deal = createTradeDealFromOffer(conv, offerMsg, user.getRole());
            conv.setTradeDealId(deal.getId());
            conv.setLastMessageText("Trade Offer ACCEPTED (Contract #" + deal.getId() + ")");
            conv.setLastMessageAt(Instant.now());
            conversationRepository.save(conv);

            // Create notification message in chat
            ChatMessage acceptMsg = new ChatMessage();
            acceptMsg.setConversationId(conv.getId());
            acceptMsg.setSenderRole("SYSTEM");
            acceptMsg.setSenderId(0L);
            acceptMsg.setSenderName("Trade System");
            acceptMsg.setMessageText("Trade agreement confirmed! Official Trade Deal #" + deal.getId() + " generated with status ACCEPTED. Both parties may now proceed with logistics and escrow.");
            acceptMsg.setOffer(false);
            acceptMsg.setSentAt(Instant.now());
            messageRepository.save(acceptMsg);

            broadcastMessage(conv, offerMsg);
            broadcastMessage(conv, acceptMsg);
            return offerMsg;

        } else if ("REJECT".equals(action)) {
            offerMsg.setOfferStatus("REJECTED");
            messageRepository.save(offerMsg);

            conv.setLastMessageText("Trade Offer DECLINED");
            conv.setLastMessageAt(Instant.now());
            conversationRepository.save(conv);

            ChatMessage rejectMsg = new ChatMessage();
            rejectMsg.setConversationId(conv.getId());
            rejectMsg.setSenderRole(user.getRole().name());
            rejectMsg.setSenderId(user.getId());
            rejectMsg.setSenderName(user.getName());
            rejectMsg.setMessageText("Trade offer declined by " + user.getName());
            rejectMsg.setOffer(false);
            rejectMsg.setSentAt(Instant.now());
            messageRepository.save(rejectMsg);

            broadcastMessage(conv, offerMsg);
            broadcastMessage(conv, rejectMsg);
            return offerMsg;

        } else if ("COUNTER".equals(action)) {
            offerMsg.setOfferStatus("COUNTERED");
            messageRepository.save(offerMsg);

            BigDecimal counterQty = req.counterQuantityKg() != null ? req.counterQuantityKg() : offerMsg.getOfferQuantityKg();
            BigDecimal counterPrice = req.counterPricePerKg() != null ? req.counterPricePerKg() : offerMsg.getOfferPricePerKg();
            BigDecimal counterTotal = counterQty.multiply(counterPrice);

            ChatMessage counterMsg = new ChatMessage();
            counterMsg.setConversationId(conv.getId());
            counterMsg.setSenderRole(user.getRole().name());
            counterMsg.setSenderId(user.getId());
            counterMsg.setSenderName(user.getName());
            counterMsg.setOffer(true);
            counterMsg.setOfferCropName(offerMsg.getOfferCropName());
            counterMsg.setOfferQuantityKg(counterQty);
            counterMsg.setOfferPricePerKg(counterPrice);
            counterMsg.setOfferTotalAmount(counterTotal);
            counterMsg.setOfferStatus("PENDING");

            String counterText = "Counter Offer: " + counterQty + " kg of " + offerMsg.getOfferCropName() + " at INR " + counterPrice + "/kg (Total: INR " + counterTotal + ")";
            if (req.counterNote() != null && !req.counterNote().isBlank()) {
                counterText += ". Note: " + req.counterNote().trim();
            }
            counterMsg.setMessageText(counterText);
            counterMsg.setSentAt(Instant.now());

            ChatMessage savedCounter = messageRepository.save(counterMsg);

            conv.setLastMessageText("Counter Offer: INR " + counterTotal + " by " + user.getName());
            conv.setLastMessageAt(Instant.now());
            conversationRepository.save(conv);

            broadcastMessage(conv, offerMsg);
            broadcastMessage(conv, savedCounter);
            return savedCounter;
        } else {
            throw new IllegalArgumentException("Unknown response action: " + action + ". Supported: ACCEPT, REJECT, COUNTER");
        }
    }

    private TradeDeal createTradeDealFromOffer(ChatConversation conv, ChatMessage offer, Role respondentRole) {
        Farmer farmer = farmerRepository.findById(conv.getFarmerId())
                .orElseThrow(() -> new IllegalArgumentException("Farmer not found"));
        Buyer buyer = buyerRepository.findById(conv.getBuyerId())
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        Crop crop = cropRepository.findByNameIgnoreCase(offer.getOfferCropName())
                .orElseGet(() -> cropRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new IllegalStateException("No crops available")));

        TradeDeal deal = new TradeDeal();
        deal.setFarmer(farmer);
        deal.setBuyer(buyer);
        deal.setCrop(crop);
        deal.setQuantity(offer.getOfferQuantityKg());
        deal.setAgreedPricePerKg(offer.getOfferPricePerKg());
        deal.setTotalAmount(offer.getOfferTotalAmount());
        deal.setNetFarmerReturn(offer.getOfferTotalAmount());
        deal.setStatus(TradeStatus.ACCEPTED);
        deal.setInitiatedBy(respondentRole);
        deal.setNotes("Trade agreed via Private Negotiation Chat: " + offer.getOfferQuantityKg() + " kg @ INR " + offer.getOfferPricePerKg() + "/kg");

        TradeDeal saved = tradeDealRepository.save(deal);
        log.info("Automatically generated active TradeDeal #{} from accepted chat offer", saved.getId());
        return saved;
    }

    private User validateUserAccess(ChatConversation conv, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        if (user.getRole() == Role.FARMER) {
            Farmer farmer = farmerRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Farmer profile not found for: " + userEmail));
            if (!conv.getFarmerId().equals(farmer.getId())) {
                throw new SecurityException("Unauthorized: Conversation does not belong to your farmer profile.");
            }
        } else if (user.getRole() == Role.BUYER) {
            Buyer buyer = buyerRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Buyer profile not found for: " + userEmail));
            if (!conv.getBuyerId().equals(buyer.getId())) {
                throw new SecurityException("Unauthorized: Conversation does not belong to your buyer profile.");
            }
        } else if (user.getRole() != Role.ADMIN) {
            throw new SecurityException("Unauthorized access to trade chat conversation.");
        }

        return user;
    }

    private void broadcastMessage(ChatConversation conv, ChatMessage msg) {
        try {
            String destination = "/topic/chat/" + conv.getId();
            messagingTemplate.convertAndSend(destination, msg);
            log.info("Broadcasted chat message #{} to STOMP destination: {}", msg.getId(), destination);
        } catch (Exception e) {
            log.warn("Could not broadcast chat message via STOMP: {}", e.getMessage());
        }
    }
}
