package com.kisanlink.config;

import com.kisanlink.entity.User;
import com.kisanlink.repository.UserRepository;
import com.kisanlink.security.JwtService;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.security.Principal;
import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final UserRepository userRepository;

    public WebSocketConfig(JwtService jwtService,
                           UserDetailsService userDetailsService,
                           UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.userRepository = userRepository;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // In-memory message broker for subscription topics & user queues
        config.enableSimpleBroker("/topic", "/queue");
        // Prefix for incoming client messages handled by application controllers
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] allowedOrigins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:5174", "http://localhost:5175"};
        // Native WebSocket STOMP endpoint with restricted CORS
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigins);

        // Fallback endpoint with SockJS
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigins)
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null) {
                    if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                        List<String> authHeaders = accessor.getNativeHeader("Authorization");
                        if (authHeaders != null && !authHeaders.isEmpty()) {
                            String authHeader = authHeaders.get(0);
                            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                                String token = authHeader.substring(7);
                                try {
                                    String email = jwtService.extractUsername(token);
                                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                                    if (jwtService.isTokenValid(token, userDetails)) {
                                        UsernamePasswordAuthenticationToken authentication =
                                                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                                        accessor.setUser(authentication);
                                    }
                                } catch (Exception ignored) {
                                }
                            }
                        }
                    } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                        String destination = accessor.getDestination();
                        Principal principal = accessor.getUser();
                        if (destination != null && (destination.startsWith("/topic/notifications/user/") || destination.startsWith("/topic/trades/user/"))) {
                            if (principal == null) {
                                throw new IllegalArgumentException("Unauthorized WebSocket subscription: Authentication required.");
                            }
                            String[] parts = destination.split("/");
                            String targetUserId = parts[parts.length - 1];
                            User user = userRepository.findByEmail(principal.getName()).orElse(null);
                            if (user == null || !user.getId().toString().equals(targetUserId)) {
                                throw new IllegalArgumentException("Forbidden: You cannot subscribe to another user's private WebSocket feed.");
                            }
                        }
                    }
                }
                return message;
            }
        });
    }
}

