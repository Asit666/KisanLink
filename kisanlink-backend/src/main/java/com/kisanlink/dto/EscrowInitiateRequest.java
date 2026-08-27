package com.kisanlink.dto;

public record EscrowInitiateRequest(
        String farmerUpiId,
        String buyerUpiId
) {}
