package com.kisanlink.controller;

import com.kisanlink.dto.TransportBookingRequest;
import com.kisanlink.dto.TransportBookingResponse;
import com.kisanlink.dto.TransportSuggestionResponse;
import com.kisanlink.service.TransportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transport")
public class TransportController {

    private final TransportService transportService;

    public TransportController(TransportService transportService) {
        this.transportService = transportService;
    }

    /**
     * GET /api/transport/suggestions/{dealId}
     * Returns ranked transporter suggestions for an ACCEPTED trade deal.
     * Accessible by both Farmer and Buyer participants.
     */
    @GetMapping("/suggestions/{dealId}")
    public List<TransportSuggestionResponse> getSuggestions(
            @PathVariable Long dealId,
            @AuthenticationPrincipal UserDetails principal) {
        return transportService.getSuggestions(dealId, principal.getUsername());
    }

    /**
     * POST /api/transport/book
     * Farmer books a transporter for their ACCEPTED deal.
     */
    @PostMapping("/book")
    @ResponseStatus(HttpStatus.CREATED)
    public TransportBookingResponse bookTransporter(
            @Valid @RequestBody TransportBookingRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        return transportService.bookTransporter(request, principal.getUsername());
    }

    /**
     * GET /api/transport/bookings/deal/{dealId}
     * Returns the active transport booking for a deal.
     */
    @GetMapping("/bookings/deal/{dealId}")
    public TransportBookingResponse getBookingForDeal(
            @PathVariable Long dealId,
            @AuthenticationPrincipal UserDetails principal) {
        return transportService.getBookingForDeal(dealId, principal.getUsername());
    }

    /**
     * GET /api/transport/transporter/{transporterId}/requests
     * Transporter sees all incoming booking requests.
     */
    @GetMapping("/transporter/{transporterId}/requests")
    public List<TransportBookingResponse> getTransporterRequests(
            @PathVariable Long transporterId,
            @AuthenticationPrincipal UserDetails principal) {
        return transportService.getTransporterRequests(transporterId, principal.getUsername());
    }

    /**
     * POST /api/transport/bookings/{id}/confirm
     * Transporter confirms (accepts) a booking.
     */
    @PostMapping("/bookings/{id}/confirm")
    public TransportBookingResponse confirmBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        return transportService.confirmBooking(id, principal.getUsername());
    }

    /**
     * POST /api/transport/bookings/{id}/reject
     * Transporter rejects a booking; trade reverts to ACCEPTED.
     */
    @PostMapping("/bookings/{id}/reject")
    public TransportBookingResponse rejectBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        return transportService.rejectBooking(id, principal.getUsername());
    }

    /**
     * POST /api/transport/bookings/{id}/delivered
     * Transporter marks goods as delivered; trade advances to DELIVERED.
     */
    @PostMapping("/bookings/{id}/delivered")
    public TransportBookingResponse markDelivered(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        return transportService.markDelivered(id, principal.getUsername());
    }
}
