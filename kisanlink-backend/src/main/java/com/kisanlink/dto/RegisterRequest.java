package com.kisanlink.dto;

import com.kisanlink.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegisterRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        String phone,
        @NotBlank String password,
        @NotNull Role role
) {
}
