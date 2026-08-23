package com.example.aidocumentassistant.repository;

import com.example.aidocumentassistant.entity.ChatMessage;
import com.example.aidocumentassistant.entity.ChatMessageSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageSourceRepository extends JpaRepository<ChatMessageSource, Long> {
    List<ChatMessageSource> findByChatMessage(ChatMessage chatMessage);
}
