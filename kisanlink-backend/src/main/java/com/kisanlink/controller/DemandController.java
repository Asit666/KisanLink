package com.kisanlink.controller;

import com.kisanlink.entity.Buyer;
import com.kisanlink.entity.Demand;
import com.kisanlink.repository.BuyerRepository;
import com.kisanlink.repository.DemandRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/demands")
public class DemandController {

    private final DemandRepository demandRepository;
    private final BuyerRepository buyerRepository;

    public DemandController(DemandRepository demandRepository, BuyerRepository buyerRepository) {
        this.demandRepository = demandRepository;
        this.buyerRepository = buyerRepository;
    }

    @PostMapping("/{buyerId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Demand createDemand(@PathVariable Long buyerId, @RequestBody Demand demandRequest) {
        Buyer buyer = buyerRepository.findById(buyerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Buyer not found"));
        demandRequest.setBuyer(buyer);
        return demandRepository.save(demandRequest);
    }

    @GetMapping("/buyer/{buyerId}")
    public List<Demand> getDemandsByBuyer(@PathVariable Long buyerId) {
        return demandRepository.findByBuyerId(buyerId);
    }

    @GetMapping
    public List<Demand> getAllDemands() {
        return demandRepository.findAll();
    }
}
