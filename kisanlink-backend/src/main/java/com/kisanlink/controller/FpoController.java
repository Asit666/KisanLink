package com.kisanlink.controller;

import com.kisanlink.entity.Farmer;
import com.kisanlink.entity.FpoProfile;
import com.kisanlink.repository.FarmerRepository;
import com.kisanlink.repository.FpoProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/fpo")
public class FpoController {
    
    private final FpoProfileRepository fpoProfileRepository;
    private final FarmerRepository farmerRepository;

    public FpoController(FpoProfileRepository fpoProfileRepository, FarmerRepository farmerRepository) {
        this.fpoProfileRepository = fpoProfileRepository;
        this.farmerRepository = farmerRepository;
    }

    @PostMapping("/{fpoId}/farmers")
    @ResponseStatus(HttpStatus.CREATED)
    public Farmer addFarmer(@PathVariable Long fpoId, @RequestBody Farmer request) {
        FpoProfile fpo = fpoProfileRepository.findById(fpoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "FPO not found"));
        request.setFpoProfile(fpo);
        return farmerRepository.save(request);
    }

    @GetMapping("/{fpoId}/farmers")
    public List<Farmer> getFarmers(@PathVariable Long fpoId) {
        return farmerRepository.findByFpoProfileId(fpoId);
    }
}
