package com.kisanlink.repository;

import com.kisanlink.entity.ChatConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {

    List<ChatConversation> findByFarmerIdOrderByLastMessageAtDesc(Long farmerId);

    List<ChatConversation> findByBuyerIdOrderByLastMessageAtDesc(Long buyerId);

    Optional<ChatConversation> findByFarmerIdAndBuyerIdAndCropNameIgnoreCase(Long farmerId, Long buyerId, String cropName);

    Optional<ChatConversation> findByFarmerIdAndBuyerId(Long farmerId, Long buyerId);
}
