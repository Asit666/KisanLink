package com.kisanlink.dto;

public record AuthResponse(
        String token,
        Long userId,
        Long profileId,
        String name,
        String role,
        String email,
        String phone
) {
    public AuthResponse(String token, Long userId, Long profileId, String name, String role) {
        this(token, userId, profileId, name, role, null, null);
    }
}
