package com.kisanlink.controller;

import com.kisanlink.entity.Buyer;
import com.kisanlink.entity.DealOffer;
import com.kisanlink.entity.Lot;
import com.kisanlink.repository.BuyerRepository;
import com.kisanlink.repository.DealOfferRepository;
import com.kisanlink.repository.LotRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/offers")
public class OfferController {

    private final DealOfferRepository dealOfferRepository;
    private final LotRepository lotRepository;
    private final BuyerRepository buyerRepository;

    public OfferController(DealOfferRepository dealOfferRepository, LotRepository lotRepository, BuyerRepository buyerRepository) {
        this.dealOfferRepository = dealOfferRepository;
        this.lotRepository = lotRepository;
        this.buyerRepository = buyerRepository;
    }

    @PostMapping("/lot/{lotId}/buyer/{buyerId}")
    @ResponseStatus(HttpStatus.CREATED)
    public DealOffer createOffer(@PathVariable Long lotId, @PathVariable Long buyerId, @RequestBody DealOffer offerRequest) {
        Lot lot = lotRepository.findById(lotId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lot not found"));
        Buyer buyer = buyerRepository.findById(buyerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Buyer not found"));
        
        offerRequest.setLot(lot);
        offerRequest.setBuyer(buyer);
        return dealOfferRepository.save(offerRequest);
    }

    @GetMapping("/lot/{lotId}")
    public List<DealOffer> getOffersByLot(@PathVariable Long lotId) {
        return dealOfferRepository.findByLotId(lotId);
    }

    @GetMapping("/buyer/{buyerId}")
    public List<DealOffer> getOffersByBuyer(@PathVariable Long buyerId) {
        return dealOfferRepository.findByBuyerId(buyerId);
    }

    @PutMapping("/{offerId}/status")
    public DealOffer updateOfferStatus(@PathVariable Long offerId, @RequestBody DealOffer statusRequest) {
        DealOffer offer = dealOfferRepository.findById(offerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offer not found"));
        offer.setStatus(statusRequest.getStatus());
        return dealOfferRepository.save(offer);
    }
}
