package com.kisanlink.controller;

import com.kisanlink.entity.User;
import com.kisanlink.entity.UserStatus;
import com.kisanlink.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;

    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PutMapping("/verify/{userId}")
    public User verifyUser(@PathVariable Long userId, @RequestBody UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setStatus(status);
        return userRepository.save(user);
    }
}
