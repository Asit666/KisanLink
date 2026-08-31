package com.kisanlink.controller;

import com.kisanlink.dto.RespondOfferRequest;
import com.kisanlink.dto.SendChatMessageRequest;
import com.kisanlink.dto.SendTradeOfferRequest;
import com.kisanlink.dto.StartConversationRequest;
import com.kisanlink.entity.ChatConversation;
import com.kisanlink.entity.ChatMessage;
import com.kisanlink.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ChatConversation>> getConversations(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(chatService.getConversationsForUser(userDetails.getUsername()));
    }

    @PostMapping("/conversations/start")
    public ResponseEntity<ChatConversation> startConversation(@Valid @RequestBody StartConversationRequest req,
                                                              @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(chatService.startOrGetConversation(req, userDetails.getUsername()));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<List<ChatMessage>> getMessages(@PathVariable Long id,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(chatService.getMessages(id, userDetails.getUsername()));
    }

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<ChatMessage> sendMessage(@PathVariable Long id,
                                                   @Valid @RequestBody SendChatMessageRequest req,
                                                   @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(chatService.sendTextMessage(id, req, userDetails.getUsername()));
    }

    @PostMapping("/conversations/{id}/offer")
    public ResponseEntity<ChatMessage> sendOffer(@PathVariable Long id,
                                                 @Valid @RequestBody SendTradeOfferRequest req,
                                                 @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(chatService.sendTradeOffer(id, req, userDetails.getUsername()));
    }

    @PostMapping("/messages/{id}/respond")
    public ResponseEntity<ChatMessage> respondOffer(@PathVariable Long id,
                                                    @Valid @RequestBody RespondOfferRequest req,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(chatService.respondToOffer(id, req, userDetails.getUsername()));
    }
}
