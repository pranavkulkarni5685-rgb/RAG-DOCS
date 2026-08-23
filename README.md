# AI Document Assistant – RAG Based Chatbot

> A production-grade, full-stack **Retrieval-Augmented Generation (RAG)** application built with **Java 22 + Spring Boot**, **MySQL**, **Google Gemini AI**, and **React + Vite**.

![Architecture](https://img.shields.io/badge/Architecture-RAG-blue.svg)
![Backend](https://img.shields.io/badge/Backend-Spring%20Boot%203.3-green.svg)
![Database](https://img.shields.io/badge/Database-MySQL%208.0-orange.svg)
![AI](https://img.shields.io/badge/AI-Google%20Gemini-purple.svg)
![Frontend](https://img.shields.io/badge/Frontend-React%2018%20+%20Vite-cyan.svg)

---

## 1. Project Overview

**AI Document Assistant** is an intelligent document inquiry system that allows users to upload single or multiple PDF documents and ask questions across all documents or specific ones. 

Unlike naive chatbots that pass entire documents directly to an LLM (causing token exhaustion and hallucinations), this application implements a strict **RAG (Retrieval-Augmented Generation)** architecture:
1. It parses PDFs page-by-page using **Apache PDFBox**.
2. It splits text into sliding-window chunks with contextual overlaps.
3. It converts chunks into 768-dimensional dense vector embeddings using Google's **`text-embedding-004`**.
4. It indexes the embeddings alongside relational metadata in **MySQL**.
5. When a user asks a question, it retrieves only the top-$K$ most relevant document chunks via **Cosine Similarity Vector Search**.
6. It sends only the retrieved chunks + strict anti-hallucination system instructions to **Google Gemini AI** (`gemini-1.5-flash`).
7. It returns structured answers accompanied by **exact page numbers, document names, relevance match scores, and text excerpts**.

---

## 2. System Architecture & RAG Pipeline

```
+-----------------------------------------------------------------------------------+
|                            React + Vite Frontend (Port 5173)                      |
|  - Dashboard: Analytics, recent docs, system health                               |
|  - Chat Assistant: Multi-document RAG chat, citations & source cards, session mgmt|
|  - Document Manager: Drag-and-drop PDF upload, progress tracking, chunk inspector |
|  - Chat History: Searchable session logs & resume conversation                    |
|  - Settings: API key configuration & health diagnostics                           |
+-----------------------------------------------------------------------------------+
                                         |
                                  (REST API / JSON)
                                         v
+-----------------------------------------------------------------------------------+
|                        Spring Boot 3 Backend (Port 8080)                          |
|                                                                                   |
|  [REST Controllers]                                                               |
|    - DocumentController (Upload, list, inspect chunks, cascading delete)          |
|    - ChatController (RAG question answering, session history, messages)          |
|    - DashboardController, HealthController & SettingsController                  |
|                                                                                   |
|  [RAG Pipeline & Core Services]                                                   |
|    1. PdfExtractionService (Apache PDFBox - page-by-page text extraction)         |
|    2. TextChunkerService (Sliding window chunking: 600 chars, 120 overlap)        |
|    3. GeminiService (REST client for embeddings & generation with grounding)      |
|    4. VectorStoreService (High-performance Cosine similarity & Top-K ranking)     |
|    5. RagChatService (Context assembly, citation mapping & answer generation)     |
|                                                                                   |
|  [Spring Data JPA Repositories & Entities]                                        |
+-----------------------------------------------------------------------------------+
                   |                                            |
                   v                                            v
+------------------------------------+        +-------------------------------------+
|        MySQL Database (3306)       |        |        Google Gemini AI API         |
|  Database: ai_document_assistant   |        |  - models/text-embedding-004        |
|  - documents & document_chunks     |        |  - models/gemini-1.5-flash          |
|  - chat_sessions & chat_messages   |        +-------------------------------------+
|  - source citations & user metadata|
+------------------------------------+
```

---

## 3. Technology Stack

### Backend
- **Language**: Java 22 (Compatible with Java 17+)
- **Framework**: Spring Boot 3.3.4 (Spring Web, Spring Data JPA, Spring Validation)
- **PDF Extraction**: Apache PDFBox 3.0.2
- **Database Driver**: MySQL Connector/J (`com.mysql:mysql-connector-j`) & H2 (runtime fallback)
- **Boilerplate Reduction**: Project Lombok
- **JSON Serialization**: Jackson 2.x
- **Build Tool**: Apache Maven 3.9.6

### Database
- **Engine**: MySQL 8.0+
- **Database Name**: `ai_document_assistant`
- **Relational Tables**: `documents`, `document_chunks`, `chat_sessions`, `chat_messages`, `chat_message_sources`, `users`

### AI & Vector Layer
- **Large Language Model (LLM)**: Google Gemini 1.5 Flash (`models/gemini-1.5-flash`)
- **Embedding Model**: Google Text Embedding 004 (`models/text-embedding-004`)
- **Vector Search Strategy**: Embeddings are persisted in MySQL `document_chunks.embedding_json` and indexed in Spring Boot using exact Cosine Similarity with configurable Top-$K$ (default: 4) and threshold (default: 0.35).

### Frontend
- **Framework**: React 18 + Vite 5
- **Routing**: React Router DOM 6
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Typography & Styling**: Clean, modern, responsive CSS with Plus Jakarta Sans & JetBrains Mono

---

## 4. Project Directory Structure

```
D:/ai-document-assistant/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/example/aidocumentassistant/
│   │   │   │   ├── config/
│   │   │   │   │   ├── CorsConfig.java
│   │   │   │   │   ├── GeminiConfig.java
│   │   │   │   │   └── RagConfig.java
│   │   │   │   ├── controller/
│   │   │   │   │   ├── ChatController.java
│   │   │   │   │   ├── DashboardController.java
│   │   │   │   │   ├── DocumentController.java
│   │   │   │   │   ├── HealthController.java
│   │   │   │   │   └── SettingsController.java
│   │   │   │   ├── dto/
│   │   │   │   │   ├── ApiResponse.java
│   │   │   │   │   ├── ChatMessageDto.java
│   │   │   │   │   ├── ChatRequestDto.java
│   │   │   │   │   ├── ChatResponseDto.java
│   │   │   │   │   ├── ChatSessionDto.java
│   │   │   │   │   ├── DashboardStatsDto.java
│   │   │   │   │   ├── DocumentChunkDto.java
│   │   │   │   │   ├── DocumentDetailDto.java
│   │   │   │   │   ├── DocumentResponseDto.java
│   │   │   │   │   ├── SettingsDto.java
│   │   │   │   │   └── SourceDto.java
│   │   │   │   ├── entity/
│   │   │   │   │   ├── ChatMessage.java
│   │   │   │   │   ├── ChatMessageSource.java
│   │   │   │   │   ├── ChatSession.java
│   │   │   │   │   ├── Document.java
│   │   │   │   │   ├── DocumentChunk.java
│   │   │   │   │   ├── DocumentStatus.java
│   │   │   │   │   ├── MessageRole.java
│   │   │   │   │   └── User.java
│   │   │   │   ├── exception/
│   │   │   │   │   ├── GeminiApiException.java
│   │   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   │   ├── InvalidFileException.java
│   │   │   │   │   ├── PdfProcessingException.java
│   │   │   │   │   └── ResourceNotFoundException.java
│   │   │   │   ├── repository/
│   │   │   │   │   ├── ChatMessageRepository.java
│   │   │   │   │   ├── ChatMessageSourceRepository.java
│   │   │   │   │   ├── ChatSessionRepository.java
│   │   │   │   │   ├── DocumentChunkRepository.java
│   │   │   │   │   ├── DocumentRepository.java
│   │   │   │   │   └── UserRepository.java
│   │   │   │   ├── service/
│   │   │   │   │   ├── DashboardService.java
│   │   │   │   │   ├── DocumentService.java
│   │   │   │   │   ├── GeminiService.java
│   │   │   │   │   ├── PdfExtractionService.java
│   │   │   │   │   ├── RagChatService.java
│   │   │   │   │   ├── TextChunkerService.java
│   │   │   │   │   └── VectorStoreService.java
│   │   │   │   └── AiDocumentAssistantApplication.java
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChunkModal.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── MarkdownRenderer.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── SourceCard.jsx
│   │   │   └── UploadModal.jsx
│   │   ├── pages/
│   │   │   ├── ChatPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── DocumentsPage.jsx
│   │   │   ├── HistoryPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── chatService.js
│   │   │   ├── dashboardService.js
│   │   │   ├── documentService.js
│   │   │   └── settingsService.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── schema.sql
├── uploads/
├── .env.example
└── README.md
```

---

## 5. Getting Started & Setup Guide

### Prerequisites
1. **Java JDK 17 or 22** installed (`java -version`)
2. **Node.js 18+** & **npm** installed (`node -v`, `npm -v`)
3. **MySQL 8.0+** running locally on `localhost:3306`
4. **Google Gemini API Key**: Obtain a key for free from [Google AI Studio](https://aistudio.google.com/).

---

### Step 1: Database Setup (MySQL)

Log in to your MySQL command line / Workbench:

```sql
CREATE DATABASE IF NOT EXISTS ai_document_assistant
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

You can run the provided `database/schema.sql` script or let Spring Boot automatically create the tables via Hibernate (`spring.jpa.hibernate.ddl-auto=update`).

---

### Step 2: Configure Environment Variables

Create your `.env` or export your environment variables:

```bash
# Google Gemini API Key
export GEMINI_API_KEY="AIzaSy..."

# MySQL Credentials (Default: root / root)
export SPRING_DATASOURCE_USERNAME="root"
export SPRING_DATASOURCE_PASSWORD="YOUR_MYSQL_PASSWORD"
```

Alternatively, you can edit `backend/src/main/resources/application.properties` or enter your API key directly in the web UI under the **Settings** page!

---

### Step 3: Run the Backend (Spring Boot)

Navigate to the `backend` directory and start the server:

```powershell
cd D:ai-document-assistantackend
# Using Maven:
D:Softwareapache-maven-3.9.6inmvn.cmd spring-boot:run

# Or run the packaged JAR directly:
java -jar targetai-document-assistant-1.0.0.jar
```

Backend starts on: **`http://localhost:8080`**

---

### Step 4: Run the Frontend (React + Vite)

Open a new terminal, navigate to the `frontend` directory, and start the development server:

```powershell
cd D:ai-document-assistantrontend
npm run dev
```

Frontend opens on: **`http://localhost:5173`**

---

## 6. REST API Reference

### Documents Endpoints (`/api/documents`)

| Method | Endpoint | Description | Request Body / Param |
|--------|----------|-------------|----------------------|
| `POST` | `/api/documents/upload` | Upload and process PDF | Multipart file (`file`) |
| `GET` | `/api/documents` | List all uploaded documents | None |
| `GET` | `/api/documents/{id}` | Get document details and all chunks | None |
| `DELETE` | `/api/documents/{id}` | Cascading delete of document, chunks, and disk file | None |

### Chat & RAG Endpoints (`/api/chat`)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `POST` | `/api/chat` | Ask question via RAG | `{"sessionId": 1, "question": "What is inheritance?", "documentIds": [1, 2]}` |
| `GET` | `/api/chat/sessions` | List all previous chat sessions | None |
| `POST` | `/api/chat/sessions` | Create a new chat session | `{"title": "Java Concepts"}` |
| `GET` | `/api/chat/sessions/{id}` | Retrieve session message history | None |
| `DELETE` | `/api/chat/sessions/{id}` | Delete chat session & messages | None |

### Analytics & System Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/stats` | Returns document counts, chunks, sessions, and recent docs |
| `GET` | `/api/health` | System health check and Gemini connection status |
| `GET` | `/api/settings` | Retrieve current configuration and model metadata |
| `POST` | `/api/settings` | Update API key, Top-K, or similarity threshold dynamically |

---

## 7. RAG Workflow & Grounding Rules

1. **Anti-Hallucination Grounding**: The Gemini prompt explicitly commands the model to answer *only* using information found in the retrieved context. If a user asks a question not present in the document, the AI responds:
   > *"I couldn't find this information in the uploaded documents."*
2. **Verified Page Citations**: Every generated response includes the list of matched sources with Document Name, Page Number, Match %, and chunk snippet.
3. **Multiple Document Scope**: Questions can be queried across all documents simultaneously or narrowed down to specific files via the Document Filter dropdown in the chat view.
4. **Cascading Clean Deletion**: Deleting a document removes its database row, extracted chunk records, embedding vectors, and local physical file from `uploads/`.

---

## 8. Academic Project Suitability

This project has been built to meet the rigorous requirements of an **MCA Final-Year Capstone Project** and professional portfolio piece:
- Full layered architecture (**Controller -> Service -> Repository -> Entity -> DTO -> Exception Handling**).
- Zero mock/fake data — implements genuine PDF parsing, real vector embeddings, and real LLM generation.
- Responsive, clean, minimal, non-distracting UI designed with accessibility and clarity.

---

## 9. License

Developed for Academic and Educational purposes. Free to use and extend.
