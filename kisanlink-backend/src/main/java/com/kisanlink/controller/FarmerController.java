package com.kisanlink.controller;

import com.kisanlink.dto.ProduceRequest;
import com.kisanlink.dto.FarmerProfileRequest;
import com.kisanlink.entity.Farmer;
import com.kisanlink.entity.FarmerProduce;
import com.kisanlink.service.FarmerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/farmers")
public class FarmerController {
    private final FarmerService farmerService;

    public FarmerController(FarmerService farmerService) {
        this.farmerService = farmerService;
    }

    @GetMapping("/{farmerId}")
    public Farmer getProfile(@PathVariable Long farmerId) {
        return farmerService.getProfile(farmerId);
    }

    @PutMapping("/{farmerId}")
    public Farmer updateProfile(@PathVariable Long farmerId,
                                @RequestBody FarmerProfileRequest request) {
        return farmerService.updateProfile(farmerId, request);
    }

    @GetMapping("/{farmerId}/produce")
    public List<FarmerProduce> listProduce(@PathVariable Long farmerId) {
        return farmerService.listProduce(farmerId);
    }

    @PostMapping("/{farmerId}/produce")
    @ResponseStatus(HttpStatus.CREATED)
    public FarmerProduce addProduce(@PathVariable Long farmerId,
                                    @Valid @RequestBody ProduceRequest request) {
        return farmerService.addProduce(farmerId, request);
    }

    @DeleteMapping("/produce/{produceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduce(@PathVariable Long produceId) {
        farmerService.deleteProduce(produceId);
    }
}
