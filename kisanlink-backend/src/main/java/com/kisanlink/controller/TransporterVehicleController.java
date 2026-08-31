package com.kisanlink.controller;

import com.kisanlink.dto.TransporterVehicleRequest;
import com.kisanlink.entity.TransporterVehicle;
import com.kisanlink.service.TransporterVehicleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transporters/me/vehicles")
public class TransporterVehicleController {

    private final TransporterVehicleService vehicleService;

    public TransporterVehicleController(TransporterVehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public List<TransporterVehicle> getMyVehicles(@AuthenticationPrincipal UserDetails principal) {
        return vehicleService.getMyVehicles(principal.getUsername());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TransporterVehicle addVehicle(
            @Valid @RequestBody TransporterVehicleRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        return vehicleService.addVehicle(request, principal.getUsername());
    }

    @PutMapping("/{id}")
    public TransporterVehicle updateVehicle(
            @PathVariable Long id,
            @Valid @RequestBody TransporterVehicleRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        return vehicleService.updateVehicle(id, request, principal.getUsername());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteVehicle(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        vehicleService.deleteVehicle(id, principal.getUsername());
    }
}
