package com.example.aidocumentassistant.repository;

import com.example.aidocumentassistant.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    List<ChatSession> findAllByOrderByUpdatedAtDesc();
}
