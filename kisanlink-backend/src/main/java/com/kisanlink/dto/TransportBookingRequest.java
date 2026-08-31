package com.kisanlink.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record TransportBookingRequest(
        @NotNull Long dealId,
        @NotNull Long transporterId,
        LocalDate scheduledDate,
        String notes
) {}
