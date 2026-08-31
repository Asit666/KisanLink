package com.kisanlink.repository;

import com.kisanlink.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByConversationIdOrderBySentAtAsc(Long conversationId);

    long countByConversationIdAndReadAtIsNull(Long conversationId);
}
