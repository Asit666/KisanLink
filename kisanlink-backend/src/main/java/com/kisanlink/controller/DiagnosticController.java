package com.kisanlink.controller;

import com.kisanlink.dto.DiagnosticRequest;
import com.kisanlink.dto.DiagnosticResponse;
import com.kisanlink.service.DiagnosticService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diagnostics")
public class DiagnosticController {

    private final DiagnosticService diagnosticService;

    public DiagnosticController(DiagnosticService diagnosticService) {
        this.diagnosticService = diagnosticService;
    }

    @PostMapping("/scan")
    @ResponseStatus(HttpStatus.CREATED)
    public DiagnosticResponse runScan(@Valid @RequestBody DiagnosticRequest request,
                                      @AuthenticationPrincipal UserDetails principal) {
        String email = principal != null ? principal.getUsername() : null;
        return diagnosticService.runDiagnosticScan(request, email);
    }

    @GetMapping("/farmer/{farmerId}")
    public List<DiagnosticResponse> getFarmerReports(@PathVariable Long farmerId,
                                                    @AuthenticationPrincipal UserDetails principal) {
        String email = principal != null ? principal.getUsername() : null;
        return diagnosticService.getFarmerReports(farmerId, email);
    }

    @GetMapping("/{id}")
    public DiagnosticResponse getReportById(@PathVariable Long id,
                                            @AuthenticationPrincipal UserDetails principal) {
        String email = principal != null ? principal.getUsername() : null;
        return diagnosticService.getReportById(id, email);
    }

    @PostMapping("/{id}/escalate")
    public DiagnosticResponse escalateReport(@PathVariable Long id,
                                             @RequestBody(required = false) Map<String, String> body,
                                             @AuthenticationPrincipal UserDetails principal) {
        String notes = body != null ? body.get("notes") : null;
        String email = principal != null ? principal.getUsername() : null;
        return diagnosticService.escalateReport(id, notes, email);
    }
}

