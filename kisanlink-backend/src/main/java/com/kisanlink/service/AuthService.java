package com.kisanlink.service;

import com.kisanlink.dto.AuthResponse;
import com.kisanlink.dto.LoginRequest;
import com.kisanlink.dto.RegisterRequest;
import com.kisanlink.entity.Buyer;
import com.kisanlink.entity.Farmer;
import com.kisanlink.entity.User;
import com.kisanlink.repository.BuyerRepository;
import com.kisanlink.repository.FarmerRepository;
import com.kisanlink.repository.UserRepository;
import com.kisanlink.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final FarmerRepository farmerRepository;
    private final BuyerRepository buyerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, FarmerRepository farmerRepository,
                       BuyerRepository buyerRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, JwtService jwtService) {
        this.userRepository = userRepository;
        this.farmerRepository = farmerRepository;
        this.buyerRepository = buyerRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.role().name().equals("ADMIN")) {
            throw new IllegalArgumentException("Admin accounts cannot be created through public registration");
        }
        String normalizedEmail = request.email() != null ? request.email().trim().toLowerCase() : "";
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(normalizedEmail);
        user.setPhone(request.phone() != null ? request.phone().trim() : null);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        userRepository.save(user);

        Long profileId = null;
        if (request.role().name().equals("FARMER")) {
            Farmer farmer = new Farmer();
            farmer.setUser(user);
            profileId = farmerRepository.save(farmer).getId();
        } else if (request.role().name().equals("BUYER")) {
            Buyer buyer = new Buyer();
            buyer.setUser(user);
            buyer.setBusinessName(request.name().trim());
            profileId = buyerRepository.save(buyer).getId();
        }

        UserDetails details = org.springframework.security.core.userdetails.User.withUsername(user.getEmail())
                .password(user.getPassword()).roles(user.getRole().name()).build();
        return response(user, profileId, jwtService.generateToken(details));
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.email() != null ? request.email().trim().toLowerCase() : "";
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.password()));
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        UserDetails details = org.springframework.security.core.userdetails.User.withUsername(user.getEmail())
                .password(user.getPassword()).roles(user.getRole().name()).build();
        Long profileId = user.getRole().name().equals("FARMER")
            ? farmerRepository.findByUserId(user.getId()).map(Farmer::getId).orElse(null)
            : buyerRepository.findByUserId(user.getId()).map(Buyer::getId).orElse(null);
        return response(user, profileId, jwtService.generateToken(details));
    }


    private AuthResponse response(User user, Long profileId, String token) {
        return new AuthResponse(token, user.getId(), profileId, user.getName(), user.getRole().name());
    }
}
