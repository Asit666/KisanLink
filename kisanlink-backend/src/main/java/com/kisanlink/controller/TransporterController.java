package com.kisanlink.controller;

import com.kisanlink.dto.TransporterProfileRequest;
import com.kisanlink.entity.Transporter;
import com.kisanlink.service.TransporterProfileService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transporters")
public class TransporterController {

    private final TransporterProfileService profileService;

    public TransporterController(TransporterProfileService profileService) {
        this.profileService = profileService;
    }

    /** GET /api/transporters/{id} — get own profile */
    @GetMapping("/{id}")
    public Transporter getProfile(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        return profileService.getProfile(id, principal.getUsername());
    }

    /** PUT /api/transporters/{id} — update profile (availability, rates, vehicle) */
    @PutMapping("/{id}")
    public Transporter updateProfile(
            @PathVariable Long id,
            @Valid @RequestBody TransporterProfileRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        return profileService.updateProfile(id, request, principal.getUsername());
    }
}
