@echo off
title RAG DOCS - Backend Server
echo ===================================================
echo   Starting RAG DOCS Spring Boot Backend (TiDB Cloud)
echo ===================================================
cd /d "%~dp0backend"

java -jar target\ai-document-assistant-1.0.0.jar --spring.datasource.password=v6k9pgycsnsyJpAE

pause
