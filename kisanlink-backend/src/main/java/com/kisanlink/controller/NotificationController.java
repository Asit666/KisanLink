package com.kisanlink.controller;

import com.kisanlink.entity.Notification;
import com.kisanlink.entity.User;
import com.kisanlink.repository.NotificationRepository;
import com.kisanlink.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationController(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public List<Notification> findMyNotifications(@AuthenticationPrincipal UserDetails principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        User user = userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @GetMapping("/user/{userId}")
    public List<Notification> findByUser(@PathVariable Long userId, @AuthenticationPrincipal UserDetails principal) {
        if (principal != null) {
            User user = userRepository.findByEmail(principal.getUsername()).orElse(null);
            if (user != null && !user.getId().equals(userId) && !isAdmin(principal)) {
                throw new AccessDeniedException("Access denied: You cannot view notifications for other users.");
            }
        }
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @PatchMapping("/{id}/read")
    public Notification markRead(@PathVariable Long id, @AuthenticationPrincipal UserDetails principal) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found: " + id));

        if (principal != null) {
            User user = userRepository.findByEmail(principal.getUsername()).orElse(null);
            if (user != null && !user.getId().equals(notification.getUser().getId()) && !isAdmin(principal)) {
                throw new AccessDeniedException("Access denied: You cannot modify notifications belonging to another user.");
            }
        }

        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    private boolean isAdmin(UserDetails principal) {
        return principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}

