package com.kisanlink.controller;

import com.kisanlink.entity.FpoProfile;
import com.kisanlink.entity.Lot;
import com.kisanlink.entity.LotContribution;
import com.kisanlink.repository.FpoProfileRepository;
import com.kisanlink.repository.LotContributionRepository;
import com.kisanlink.repository.LotRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/lots")
public class LotController {

    private final LotRepository lotRepository;
    private final LotContributionRepository lotContributionRepository;
    private final FpoProfileRepository fpoProfileRepository;

    public LotController(LotRepository lotRepository, LotContributionRepository lotContributionRepository, FpoProfileRepository fpoProfileRepository) {
        this.lotRepository = lotRepository;
        this.lotContributionRepository = lotContributionRepository;
        this.fpoProfileRepository = fpoProfileRepository;
    }

    @PostMapping("/{fpoId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Lot createLot(@PathVariable Long fpoId, @RequestBody Lot lotRequest) {
        FpoProfile fpo = fpoProfileRepository.findById(fpoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "FPO not found"));
        lotRequest.setFpoProfile(fpo);
        return lotRepository.save(lotRequest);
    }

    @GetMapping("/fpo/{fpoId}")
    public List<Lot> getLotsByFpo(@PathVariable Long fpoId) {
        return lotRepository.findByFpoProfileId(fpoId);
    }

    @GetMapping
    public List<Lot> getAllLots() {
        return lotRepository.findAll();
    }

    @PostMapping("/{lotId}/contributions")
    @ResponseStatus(HttpStatus.CREATED)
    public LotContribution addContribution(@PathVariable Long lotId, @RequestBody LotContribution contribution) {
        Lot lot = lotRepository.findById(lotId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lot not found"));
        contribution.setLot(lot);
        return lotContributionRepository.save(contribution);
    }

    @GetMapping("/{lotId}/contributions")
    public List<LotContribution> getContributions(@PathVariable Long lotId) {
        return lotContributionRepository.findByLotId(lotId);
    }
}
