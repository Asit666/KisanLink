package com.kisanlink.dto;

public record AuthResponse(String token, Long userId, Long profileId, String name, String role) {
}
