package com.kisanlink.security;

import com.kisanlink.entity.User;
import com.kisanlink.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        if (identifier == null || identifier.isBlank()) {
            throw new UsernameNotFoundException("Identifier cannot be empty");
        }
        String clean = identifier.trim();
        String normalizedEmail = clean.toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .or(() -> userRepository.findFirstByPhone(clean))
                .orElseThrow(() -> new UsernameNotFoundException("User not found with identifier: " + identifier));
        return org.springframework.security.core.userdetails.User.withUsername(user.getEmail())
                .password(user.getPassword())
                .roles(user.getRole().name())
                .build();
    }
}
