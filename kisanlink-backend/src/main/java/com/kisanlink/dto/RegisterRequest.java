package com.kisanlink.dto;

import com.kisanlink.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @Pattern(regexp = "^(\\+91)?[0-9]{10}$", message = "Phone must be a valid 10-digit mobile number") String phone,
        @NotBlank @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters") String password,
        @NotNull Role role
) {
}

