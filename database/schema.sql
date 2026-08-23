-- =========================================================
-- Database Schema for AI Document Assistant - RAG Chatbot
-- Database: ai_document_assistant
-- =========================================================

CREATE DATABASE IF NOT EXISTS ai_document_assistant
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ai_document_assistant;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ROLE_USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    page_count INT DEFAULT 0,
    chunk_count INT DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PROCESSING',
    error_message TEXT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_doc_status (status),
    INDEX idx_doc_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Document Chunks Table
CREATE TABLE IF NOT EXISTS document_chunks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT NOT NULL,
    chunk_index INT NOT NULL,
    page_number INT NOT NULL,
    chunk_text LONGTEXT NOT NULL,
    embedding_json LONGTEXT NULL,
    token_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chunks_document FOREIGN KEY (document_id)
        REFERENCES documents (id) ON DELETE CASCADE,
    INDEX idx_chunk_doc (document_id),
    INDEX idx_chunk_page (document_id, page_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL,
    message LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_session FOREIGN KEY (session_id)
        REFERENCES chat_sessions (id) ON DELETE CASCADE,
    INDEX idx_message_session (session_id),
    INDEX idx_message_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Chat Message Sources Table
CREATE TABLE IF NOT EXISTS chat_message_sources (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id BIGINT NOT NULL,
    document_id BIGINT NULL,
    document_name VARCHAR(255) NOT NULL,
    page_number INT NOT NULL,
    relevance_score DOUBLE NOT NULL,
    chunk_snippet TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sources_message FOREIGN KEY (message_id)
        REFERENCES chat_messages (id) ON DELETE CASCADE,
    INDEX idx_source_message (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
