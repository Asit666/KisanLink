package com.kisanlink.service;

import com.kisanlink.dto.AuthResponse;
import com.kisanlink.dto.LoginRequest;
import com.kisanlink.dto.RegisterRequest;
import com.kisanlink.entity.Buyer;
import com.kisanlink.entity.Farmer;
import com.kisanlink.entity.Transporter;
import com.kisanlink.entity.User;
import com.kisanlink.repository.BuyerRepository;
import com.kisanlink.repository.FarmerRepository;
import com.kisanlink.repository.TransporterRepository;
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
    private final TransporterRepository transporterRepository;
    private final com.kisanlink.repository.FpoProfileRepository fpoProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, FarmerRepository farmerRepository,
                       BuyerRepository buyerRepository, TransporterRepository transporterRepository,
                       com.kisanlink.repository.FpoProfileRepository fpoProfileRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, JwtService jwtService) {
        this.userRepository = userRepository;
        this.farmerRepository = farmerRepository;
        this.buyerRepository = buyerRepository;
        this.transporterRepository = transporterRepository;
        this.fpoProfileRepository = fpoProfileRepository;
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
        String normalizedPhone = request.phone() != null ? request.phone().trim() : null;

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(normalizedEmail);
        user.setPhone(normalizedPhone);
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
        } else if (request.role().name().equals("TRANSPORTER")) {
            Transporter transporter = new Transporter();
            transporter.setUser(user);
            profileId = transporterRepository.save(transporter).getId();
        } else if (request.role().name().equals("FPO")) {
            com.kisanlink.entity.FpoProfile fpo = new com.kisanlink.entity.FpoProfile();
            fpo.setUser(user);
            fpo.setFpoName(request.name().trim());
            profileId = fpoProfileRepository.save(fpo).getId();
        }

        UserDetails details = org.springframework.security.core.userdetails.User.withUsername(user.getEmail())
                .password(user.getPassword()).roles(user.getRole().name()).build();
        return response(user, profileId, jwtService.generateToken(details));
    }

    public AuthResponse login(LoginRequest request) {
        String identifier = request.email() != null ? request.email().trim() : "";
        String normalizedEmail = identifier.toLowerCase();
        
        User user = userRepository.findByEmail(normalizedEmail)
                .or(() -> userRepository.findFirstByPhone(identifier))
                .orElseThrow(() -> new IllegalArgumentException("User not found with provided credentials"));

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), request.password()));

        UserDetails details = org.springframework.security.core.userdetails.User.withUsername(user.getEmail())
                .password(user.getPassword()).roles(user.getRole().name()).build();
        Long profileId = switch (user.getRole().name()) {
            case "FARMER" -> farmerRepository.findByUserId(user.getId()).map(Farmer::getId).orElse(null);
            case "BUYER" -> buyerRepository.findByUserId(user.getId()).map(Buyer::getId).orElse(null);
            case "TRANSPORTER" -> transporterRepository.findByUserId(user.getId()).map(Transporter::getId).orElse(null);
            case "FPO" -> fpoProfileRepository.findByUserId(user.getId()).map(com.kisanlink.entity.FpoProfile::getId).orElse(null);
            default -> null;
        };
        return response(user, profileId, jwtService.generateToken(details));
    }

    private AuthResponse response(User user, Long profileId, String token) {
        return new AuthResponse(token, user.getId(), profileId, user.getName(), user.getRole().name(), user.getEmail(), user.getPhone());
    }
}
