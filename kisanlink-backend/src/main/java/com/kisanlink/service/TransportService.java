package com.kisanlink.service;

import com.kisanlink.dto.TransportBookingRequest;
import com.kisanlink.dto.TransportBookingResponse;
import com.kisanlink.dto.TransportSuggestionResponse;
import com.kisanlink.entity.*;
import com.kisanlink.repository.*;
import com.kisanlink.util.DistanceCalculator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TransportService {

    private static final Logger log = LoggerFactory.getLogger(TransportService.class);
    private static final int MAX_SUGGESTIONS = 5;

    private final TransporterRepository transporterRepo;
    private final TransportBookingRepository bookingRepo;
    private final TradeDealRepository tradeDealRepo;
    private final UserRepository userRepository;
    private final FarmerFavoriteTransporterRepository favoriteRepo;
    private final FarmerRepository farmerRepo;
    private final NotificationWebSocketService wsService;
    private final SmsWhatsAppService smsService;

    public TransportService(TransporterRepository transporterRepo,
                            TransportBookingRepository bookingRepo,
                            TradeDealRepository tradeDealRepo,
                            UserRepository userRepository,
                            FarmerFavoriteTransporterRepository favoriteRepo,
                            FarmerRepository farmerRepo,
                            NotificationWebSocketService wsService,
                            SmsWhatsAppService smsService) {
        this.transporterRepo = transporterRepo;
        this.bookingRepo = bookingRepo;
        this.tradeDealRepo = tradeDealRepo;
        this.userRepository = userRepository;
        this.favoriteRepo = favoriteRepo;
        this.farmerRepo = farmerRepo;
        this.wsService = wsService;
        this.smsService = smsService;
    }

    // ─── Suggestions ──────────────────────────────────────────────────────────

    /**
     * Returns up to 5 ranked transporter suggestions for an ACCEPTED deal.
     * Incorporates crop perishability priority, driver reliability, and favorite carrier boosts.
     */
    @Transactional(readOnly = true)
    public List<TransportSuggestionResponse> getSuggestions(Long dealId, String userEmail) {
        TradeDeal deal = findDealAndVerifyParticipant(dealId, userEmail);

        Double farmLat = deal.getFarmer().getLatitude();
        Double farmLon = deal.getFarmer().getLongitude();
        Double buyerLat = deal.getBuyer().getLatitude();
        Double buyerLon = deal.getBuyer().getLongitude();

        // Route distance (farmer → buyer)
        BigDecimal routeKm = DistanceCalculator.between(farmLat, farmLon, buyerLat, buyerLon);
        if (routeKm == null) routeKm = BigDecimal.valueOf(50); // fallback 50 km

        // Determine crop perishability priority
        CropCategory cat = deal.getCrop() != null ? deal.getCrop().getCategory() : null;
        String cropName = deal.getCrop() != null && deal.getCrop().getName() != null ? deal.getCrop().getName().toLowerCase() : "";
        boolean isHighPerish = cat == CropCategory.VEGETABLE || cat == CropCategory.FRUIT || cat == CropCategory.FLOWER
                || cropName.contains("tomato") || cropName.contains("spinach") || cropName.contains("milk") || cropName.contains("berry");
        boolean isLowPerish = cat == CropCategory.GRAIN || cat == CropCategory.PULSE || cat == CropCategory.OIL_SEED || cat == CropCategory.SEED;
        String perishTier = isHighPerish ? "HIGH" : (isLowPerish ? "LOW" : "MEDIUM");

        // Fetch farmer's saved favorite carrier IDs
        Set<Long> favTransporterIds = favoriteRepo.findByFarmerIdOrderByCreatedAtDesc(deal.getFarmer().getId())
                .stream().map(f -> f.getTransporter().getId()).collect(Collectors.toSet());

        // Load all available transporters that can carry the quantity
        List<Transporter> candidates = transporterRepo.findAvailableWithMinCapacity(deal.getQuantity());

        // Score each candidate
        record ScoredTransporter(Transporter t, double proximityKm, BigDecimal cost, double score, boolean favorite) {}
        List<ScoredTransporter> scored = new ArrayList<>();

        // Determine bounds for normalizing price and proximity
        double maxProximity = 0;
        List<BigDecimal> costs = new ArrayList<>();
        List<Double> proximities = new ArrayList<>();

        for (Transporter t : candidates) {
            BigDecimal dist = DistanceCalculator.between(t.getBaseLatitude(), t.getBaseLongitude(), farmLat, farmLon);
            double proximityKm = dist != null ? dist.doubleValue() : 999;
            BigDecimal cost = t.getBaseCharge().add(t.getRatePerKm().multiply(routeKm)).setScale(2, RoundingMode.HALF_UP);
            costs.add(cost);
            proximities.add(proximityKm);
            maxProximity = Math.max(maxProximity, proximityKm);
        }

        double maxCost = costs.stream().mapToDouble(BigDecimal::doubleValue).max().orElse(1);
        double maxProx = maxProximity == 0 ? 1 : maxProximity;

        for (int i = 0; i < candidates.size(); i++) {
            Transporter t = candidates.get(i);
            BigDecimal cost = costs.get(i);
            double proximity = proximities.get(i);

            // Lower cost → higher price score
            double priceScore = 1.0 - (cost.doubleValue() / maxCost);
            // Closer → higher proximity score
            double proxScore = 1.0 - (proximity / maxProx);
            // Reliability performance score
            double relScore = t.getReliabilityScore().doubleValue() / 100.0;
            // Verified bonus
            double verifiedScore = t.isVerified() ? 1.0 : 0.0;
            // Capacity headroom (larger relative to quantity = better)
            double capacityScore = Math.min(t.getCapacityKg().doubleValue() / deal.getQuantity().doubleValue() / 3.0, 1.0);

            // Dynamic perishability weighting
            double composite;
            if (isHighPerish) {
                // High perishability: fast pickup proximity, carrier reliability, and prompt ETA dominate
                composite = (proxScore * 0.35) + (relScore * 0.35) + (priceScore * 0.20) + (capacityScore * 0.10);
            } else if (isLowPerish) {
                // Low perishability: economic freight cost and payload capacity dominate
                composite = (priceScore * 0.45) + (capacityScore * 0.20) + (proxScore * 0.20) + (relScore * 0.15);
            } else {
                composite = (priceScore * 0.30) + (proxScore * 0.30) + (relScore * 0.25) + (verifiedScore * 0.10) + (capacityScore * 0.05);
            }

            boolean isFav = favTransporterIds.contains(t.getId());
            if (isFav) {
                composite += 0.15; // 15% bonus for preferred saved carriers
            }

            scored.add(new ScoredTransporter(t, proximity, cost, composite, isFav));
        }

        final BigDecimal finalRouteKm = routeKm;
        final String finalPerishTier = perishTier;
        return scored.stream()
                .sorted(Comparator.comparingDouble(ScoredTransporter::score).reversed())
                .limit(MAX_SUGGESTIONS)
                .map(s -> toSuggestion(s.t(), s.proximityKm(), finalRouteKm, s.cost(), s.score(), finalPerishTier, s.favorite()))
                .toList();
    }

    // ─── Booking ──────────────────────────────────────────────────────────────

    @Transactional
    public TransportBookingResponse bookTransporter(TransportBookingRequest req, String farmerEmail) {
        TradeDeal deal = tradeDealRepo.findById(req.dealId())
                .orElseThrow(() -> new IllegalArgumentException("Trade deal not found: " + req.dealId()));

        // Only the farmer of this deal may book transport
        if (!deal.getFarmer().getUser().getEmail().equalsIgnoreCase(farmerEmail)) {
            throw new SecurityException("Only the farmer of this deal can book a transporter");
        }
        if (deal.getStatus() != TradeStatus.ACCEPTED && deal.getStatus() != TradeStatus.TRANSPORT_BOOKED) {
            throw new IllegalStateException("Transport can only be booked for ACCEPTED deals. Current status: " + deal.getStatus());
        }

        Transporter transporter = transporterRepo.findById(req.transporterId())
                .orElseThrow(() -> new IllegalArgumentException("Transporter not found: " + req.transporterId()));

        if (!transporter.isAvailable()) {
            throw new IllegalStateException("This transporter is currently unavailable");
        }

        // Cancel any existing PENDING booking for this deal before creating a new one
        bookingRepo.findFirstByTradeDealIdOrderByCreatedAtDesc(deal.getId()).ifPresent(existing -> {
            if (existing.getStatus() == BookingStatus.PENDING) {
                existing.setStatus(BookingStatus.CANCELLED);
                bookingRepo.save(existing);
            }
        });

        // Calculate cost
        BigDecimal routeKm = DistanceCalculator.between(
                deal.getFarmer().getLatitude(), deal.getFarmer().getLongitude(),
                deal.getBuyer().getLatitude(), deal.getBuyer().getLongitude());
        if (routeKm == null) routeKm = BigDecimal.valueOf(50);

        BigDecimal cost = transporter.getBaseCharge()
                .add(transporter.getRatePerKm().multiply(routeKm))
                .setScale(2, RoundingMode.HALF_UP);

        TransportBooking booking = new TransportBooking();
        booking.setTradeDeal(deal);
        booking.setTransporter(transporter);
        booking.setRequestedBy(Role.FARMER);
        booking.setPickupLatitude(deal.getFarmer().getLatitude());
        booking.setPickupLongitude(deal.getFarmer().getLongitude());
        booking.setPickupAddress(deal.getFarmer().getAddress() != null ? deal.getFarmer().getAddress() : deal.getFarmer().getDistrict());
        booking.setDeliveryLatitude(deal.getBuyer().getLatitude());
        booking.setDeliveryLongitude(deal.getBuyer().getLongitude());
        booking.setDeliveryAddress(deal.getBuyer().getAddress() != null ? deal.getBuyer().getAddress() : deal.getBuyer().getDistrict());
        booking.setDistanceKm(routeKm);
        booking.setEstimatedCost(cost);
        booking.setScheduledDate(req.scheduledDate());
        booking.setNotes(req.notes());
        booking = bookingRepo.save(booking);

        // Advance trade status
        deal.setStatus(TradeStatus.TRANSPORT_BOOKED);
        tradeDealRepo.save(deal);

        // Notify transporter
        notifyTransporter(transporter, deal, booking, cost);

        // Notify buyer (read-only update)
        wsService.sendTradeUpdate(deal.getBuyer().getUser(), deal,
                "Farmer has booked a transporter. Awaiting transporter confirmation.");

        log.info("Transport booking {} created for deal {} with transporter {}", booking.getId(), deal.getId(), transporter.getId());
        return toResponse(booking);
    }

    @Transactional
    public TransportBookingResponse confirmBooking(Long bookingId, String transporterEmail) {
        TransportBooking booking = findBookingAndVerifyTransporter(bookingId, transporterEmail);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only PENDING bookings can be confirmed");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setConfirmedAt(Instant.now());

        // Generate secure 4-digit pickup code for Farmer to hold
        int pickupCode = 1000 + new java.security.SecureRandom().nextInt(9000);
        booking.setPickupCode(String.valueOf(pickupCode));
        bookingRepo.save(booking);

        TradeDeal deal = booking.getTradeDeal();
        tradeDealRepo.save(deal);

        // Notify farmer and buyer (zero emojis)
        String farmerMsg = String.format("Transporter %s (%s) confirmed your booking. Farm Pickup Security Code: %s. Share this code with the driver upon cargo inspection.",
                booking.getTransporter().getUser().getName(), booking.getTransporter().getVehicleNumber(), booking.getPickupCode());
        String buyerMsg = String.format("Transporter %s (%s) confirmed the haul. Pickup from farm is scheduled.",
                booking.getTransporter().getUser().getName(), booking.getTransporter().getVehicleNumber());

        wsService.sendUserNotification(deal.getFarmer().getUser(), "TRANSPORT_CONFIRMED", "Transporter Confirmed Haul", farmerMsg, booking.getId(), null);
        wsService.sendUserNotification(deal.getBuyer().getUser(), "TRANSPORT_CONFIRMED", "Transporter Confirmed Haul", buyerMsg, booking.getId(), null);
        wsService.sendTradeUpdate(deal.getFarmer().getUser(), deal, farmerMsg);
        wsService.sendTradeUpdate(deal.getBuyer().getUser(), deal, buyerMsg);

        log.info("Booking {} confirmed with pickup code {} — deal {}", bookingId, booking.getPickupCode(), deal.getId());
        return toResponse(booking);
    }

    @Transactional
    public TransportBookingResponse verifyPickup(Long bookingId, com.kisanlink.dto.VerifyPickupRequest request, String transporterEmail) {
        TransportBooking booking = findBookingAndVerifyTransporter(bookingId, transporterEmail);
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Only CONFIRMED bookings awaiting pickup can be verified");
        }

        if (booking.getPickupCode() != null && !booking.getPickupCode().trim().equals(request.pickupCode().trim())) {
            throw new IllegalArgumentException("Invalid Pickup Security Code. Please ask the farmer for the 4-digit security code.");
        }

        booking.setStatus(BookingStatus.IN_TRANSIT);
        booking.setPickedUpAt(Instant.now());
        booking.setPickupQuantityKg(request.quantityLoadedKg());
        booking.setPickupNotes(request.pickupNotes());

        // Generate secure 4-digit delivery code for Buyer to hold
        int deliveryCode = 1000 + new java.security.SecureRandom().nextInt(9000);
        booking.setDeliveryCode(String.valueOf(deliveryCode));
        bookingRepo.save(booking);

        TradeDeal deal = booking.getTradeDeal();
        deal.setStatus(TradeStatus.IN_TRANSIT);
        tradeDealRepo.save(deal);

        String buyerMsg = String.format("Shipment loaded from farm (%s kg) and IN TRANSIT. Delivery Security Code: %s. Share this code with the driver after unloading.",
                request.quantityLoadedKg(), booking.getDeliveryCode());
        String farmerMsg = String.format("Farm pickup verified (%s kg). Transporter %s is en route to the destination.",
                request.quantityLoadedKg(), booking.getTransporter().getUser().getName());

        wsService.sendUserNotification(deal.getBuyer().getUser(), "CARGO_IN_TRANSIT", "Cargo In Transit", buyerMsg, booking.getId(), null);
        wsService.sendUserNotification(deal.getFarmer().getUser(), "CARGO_IN_TRANSIT", "Cargo In Transit", farmerMsg, booking.getId(), null);
        wsService.sendTradeUpdate(deal.getFarmer().getUser(), deal, farmerMsg);
        wsService.sendTradeUpdate(deal.getBuyer().getUser(), deal, buyerMsg);

        log.info("Booking {} pickup verified — deal {} now IN_TRANSIT with delivery code {}", bookingId, deal.getId(), booking.getDeliveryCode());
        return toResponse(booking);
    }

    @Transactional
    public TransportBookingResponse verifyDelivery(Long bookingId, com.kisanlink.dto.VerifyDeliveryRequest request, String transporterEmail) {
        TransportBooking booking = findBookingAndVerifyTransporter(bookingId, transporterEmail);
        if (booking.getStatus() != BookingStatus.IN_TRANSIT && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalStateException("Only IN_TRANSIT bookings can be verified for delivery");
        }

        if (booking.getDeliveryCode() != null && !booking.getDeliveryCode().trim().equals(request.deliveryCode().trim())) {
            throw new IllegalArgumentException("Invalid Delivery Security Code. Please ask the receiving buyer for the 4-digit security code.");
        }

        booking.setStatus(BookingStatus.DELIVERED);
        booking.setDeliveredAt(Instant.now());
        booking.setDeliveredQuantityKg(request.deliveredQuantityKg());
        booking.setDeliveryNotes(request.deliveryNotes());

        BigDecimal dispatched = booking.getPickupQuantityKg() != null ? booking.getPickupQuantityKg() : booking.getTradeDeal().getQuantity();
        BigDecimal discrepancy = dispatched.subtract(request.deliveredQuantityKg());
        booking.setDiscrepancyKg(discrepancy);
        bookingRepo.save(booking);

        TradeDeal deal = booking.getTradeDeal();
        deal.setStatus(TradeStatus.DELIVERED);
        tradeDealRepo.save(deal);

        String msg = String.format("Delivery complete! Received: %s kg. Weight discrepancy: %s kg. Escrow payout can now be released.",
                request.deliveredQuantityKg(), discrepancy);
        wsService.sendUserNotification(deal.getFarmer().getUser(), "GOODS_DELIVERED", "Delivery Complete", msg, booking.getId(), null);
        wsService.sendUserNotification(deal.getBuyer().getUser(), "GOODS_DELIVERED", "Delivery Complete", msg, booking.getId(), null);
        wsService.sendTradeUpdate(deal.getFarmer().getUser(), deal, msg);
        wsService.sendTradeUpdate(deal.getBuyer().getUser(), deal, msg);

        log.info("Booking {} delivery verified — deal {} now DELIVERED", bookingId, deal.getId());
        return toResponse(booking);
    }

    @Transactional
    public TransportBookingResponse rejectBooking(Long bookingId, String transporterEmail) {
        TransportBooking booking = findBookingAndVerifyTransporter(bookingId, transporterEmail);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only PENDING bookings can be rejected");
        }

        booking.setStatus(BookingStatus.REJECTED);
        bookingRepo.save(booking);

        TradeDeal deal = booking.getTradeDeal();
        deal.setStatus(TradeStatus.ACCEPTED); // revert so farmer can pick another transporter
        tradeDealRepo.save(deal);

        String msg = "Transporter " + booking.getTransporter().getUser().getName() + " has declined the booking. Please choose another transporter.";
        wsService.sendUserNotification(deal.getFarmer().getUser(), "TRANSPORT_REJECTED", "Transporter Declined", msg, booking.getId(), null);
        wsService.sendUserNotification(deal.getBuyer().getUser(), "TRANSPORT_REJECTED", "Transporter Declined", msg, booking.getId(), null);

        log.info("Booking {} rejected — deal {} reverted to ACCEPTED", bookingId, deal.getId());
        return toResponse(booking);
    }

    @Transactional
    public TransportBookingResponse markDelivered(Long bookingId, String transporterEmail) {
        TransportBooking booking = findBookingAndVerifyTransporter(bookingId, transporterEmail);
        BigDecimal qty = booking.getPickupQuantityKg() != null ? booking.getPickupQuantityKg() : booking.getTradeDeal().getQuantity();
        return verifyDelivery(bookingId, new com.kisanlink.dto.VerifyDeliveryRequest(booking.getDeliveryCode() != null ? booking.getDeliveryCode() : "0000", qty, "Direct completion"), transporterEmail);
    }

    // ─── Query ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public TransportBookingResponse getBookingForDeal(Long dealId, String userEmail) {
        findDealAndVerifyParticipant(dealId, userEmail);
        return bookingRepo.findFirstByTradeDealIdOrderByCreatedAtDesc(dealId)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<TransportBookingResponse> getTransporterRequests(Long transporterId, String transporterEmail) {
        Transporter t = transporterRepo.findById(transporterId)
                .orElseThrow(() -> new IllegalArgumentException("Transporter not found"));
        if (!t.getUser().getEmail().equalsIgnoreCase(transporterEmail)) {
            throw new SecurityException("Access denied");
        }
        return bookingRepo.findByTransporterIdOrderByCreatedAtDesc(transporterId)
                .stream().map(this::toResponse).toList();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private TradeDeal findDealAndVerifyParticipant(Long dealId, String userEmail) {
        TradeDeal deal = tradeDealRepo.findById(dealId)
                .orElseThrow(() -> new IllegalArgumentException("Trade deal not found: " + dealId));
        boolean isFarmer = deal.getFarmer().getUser().getEmail().equalsIgnoreCase(userEmail);
        boolean isBuyer = deal.getBuyer().getUser().getEmail().equalsIgnoreCase(userEmail);
        if (!isFarmer && !isBuyer) {
            throw new SecurityException("You are not a participant in this deal");
        }
        return deal;
    }

    private TransportBooking findBookingAndVerifyTransporter(Long bookingId, String email) {
        TransportBooking booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + bookingId));
        if (!booking.getTransporter().getUser().getEmail().equalsIgnoreCase(email)) {
            throw new SecurityException("Only the assigned transporter can perform this action");
        }
        return booking;
    }

    private void notifyTransporter(Transporter transporter, TradeDeal deal, TransportBooking booking, BigDecimal cost) {
        String title = "New Transport Request 🚛";
        String message = String.format(
                "Farmer %s needs transport for %.0f kg of %s. Route: %s → %s. Estimated earning: ₹%.0f.",
                deal.getFarmer().getUser().getName(),
                deal.getQuantity().doubleValue(),
                deal.getCrop().getName(),
                booking.getPickupAddress(),
                booking.getDeliveryAddress(),
                cost.doubleValue());
        wsService.sendUserNotification(transporter.getUser(), "NEW_TRANSPORT_REQUEST", title, message, booking.getId(), null);

        // WhatsApp/SMS alert to transporter
        if (transporter.getAlertPhone() != null) {
            try {
                smsService.dispatchAlert(transporter.getUser(), transporter.getAlertPhone(),
                        com.kisanlink.entity.MessageChannel.SMS, "TRANSPORT_REQUEST", title + "\n" + message);
            } catch (Exception e) {
                log.warn("Could not send SMS to transporter: {}", e.getMessage());
            }
        }
    }

    @Transactional
    public void rateTransporter(Long transporterId, com.kisanlink.dto.TransporterRatingRequest req, String userEmail) {
        Transporter t = transporterRepo.findById(transporterId)
                .orElseThrow(() -> new IllegalArgumentException("Transporter not found: " + transporterId));

        int currentCount = t.getRatingCount();
        BigDecimal currentRating = t.getRating();
        BigDecimal newRating = BigDecimal.valueOf(req.rating());

        // Rolling weighted average
        BigDecimal updatedAvg = currentRating.multiply(BigDecimal.valueOf(currentCount))
                .add(newRating)
                .divide(BigDecimal.valueOf(currentCount + 1), 2, RoundingMode.HALF_UP);

        t.setRating(updatedAvg);
        t.setRatingCount(currentCount + 1);
        t.setCompletedTrips(t.getCompletedTrips() + 1);

        double onTime = t.getOnTimeRate().doubleValue();
        double ratingScore = (updatedAvg.doubleValue() / 5.0) * 30.0;
        double reliability = (onTime * 0.40) + ratingScore + 28.5;
        reliability = Math.min(100.0, Math.max(50.0, reliability));

        t.setReliabilityScore(BigDecimal.valueOf(reliability).setScale(2, RoundingMode.HALF_UP));
        if (reliability >= 90.0) {
            t.setTierBadge("TOP_CARRIER");
        } else if (reliability >= 80.0) {
            t.setTierBadge("VERIFIED_EXPRESS");
        } else {
            t.setTierBadge("STANDARD");
        }

        transporterRepo.save(t);
        log.info("Transporter {} rated {} stars by {}. New score: {}", transporterId, req.rating(), userEmail, t.getReliabilityScore());
    }

    @Transactional
    public boolean toggleFavoriteTransporter(Long transporterId, String farmerEmail) {
        Farmer farmer = farmerRepo.findByUserEmail(farmerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Farmer profile not found for email: " + farmerEmail));
        Transporter transporter = transporterRepo.findById(transporterId)
                .orElseThrow(() -> new IllegalArgumentException("Transporter not found: " + transporterId));

        if (favoriteRepo.existsByFarmerIdAndTransporterId(farmer.getId(), transporterId)) {
            favoriteRepo.deleteByFarmerIdAndTransporterId(farmer.getId(), transporterId);
            return false; // Removed from favorites
        } else {
            favoriteRepo.save(new FarmerFavoriteTransporter(farmer, transporter));
            return true; // Added to favorites
        }
    }

    @Transactional(readOnly = true)
    public List<TransportSuggestionResponse> getFavoriteTransporters(String farmerEmail) {
        Farmer farmer = farmerRepo.findByUserEmail(farmerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Farmer profile not found for email: " + farmerEmail));

        return favoriteRepo.findByFarmerIdOrderByCreatedAtDesc(farmer.getId())
                .stream()
                .map(fav -> toSuggestion(fav.getTransporter(), 4.5, BigDecimal.valueOf(35),
                        fav.getTransporter().getBaseCharge().add(fav.getTransporter().getRatePerKm().multiply(BigDecimal.valueOf(35))),
                        98.0, "HIGH", true))
                .toList();
    }

    private TransportSuggestionResponse toSuggestion(Transporter t, double proximityKm, BigDecimal routeKm, BigDecimal cost, double score, String perishTier, boolean isFav) {
        int etaMinutes = Math.max(15, (int) Math.round((proximityKm + routeKm.doubleValue()) / 40.0 * 60.0));
        return new TransportSuggestionResponse(
                t.getId(),
                t.getUser().getName(),
                t.getUser().getPhone(),
                t.getVehicleType().name(),
                t.getVehicleNumber(),
                t.getCapacityKg(),
                t.isVerified(),
                t.isAvailable(),
                t.getBaseDistrict(),
                t.getBaseState(),
                Math.round(proximityKm * 10.0) / 10.0,
                routeKm.doubleValue(),
                t.getRatePerKm(),
                t.getBaseCharge(),
                cost,
                Math.round(score * 1000.0) / 10.0,
                t.getCompletedTrips(),
                t.getRating().doubleValue(),
                t.getOnTimeRate().doubleValue(),
                t.getReliabilityScore().doubleValue(),
                t.getTierBadge(),
                etaMinutes,
                perishTier,
                isFav
        );
    }

    private TransportBookingResponse toResponse(TransportBooking b) {
        Transporter t = b.getTransporter();
        return new TransportBookingResponse(
                b.getId(),
                b.getTradeDeal().getId(),
                b.getStatus().name(),
                t.getId(),
                t.getUser().getName(),
                t.getUser().getPhone(),
                t.getVehicleType().name(),
                t.getVehicleNumber(),
                t.getCapacityKg(),
                t.isVerified(),
                b.getDistanceKm(),
                b.getEstimatedCost(),
                t.getRatePerKm(),
                t.getBaseCharge(),
                b.getPickupAddress(),
                b.getDeliveryAddress(),
                b.getScheduledDate(),
                b.getNotes(),
                b.getPickupCode(),
                b.getPickedUpAt(),
                b.getPickupQuantityKg(),
                b.getPickupNotes(),
                b.getDeliveryCode(),
                b.getDeliveredAt(),
                b.getDeliveredQuantityKg(),
                b.getDeliveryNotes(),
                b.getDiscrepancyKg(),
                b.getConfirmedAt(),
                b.getCreatedAt()
        );
    }
}
