package com.example.aidocumentassistant.repository;

import com.example.aidocumentassistant.entity.ChatMessage;
import com.example.aidocumentassistant.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findBySessionOrderByCreatedAtAsc(ChatSession session);
}
