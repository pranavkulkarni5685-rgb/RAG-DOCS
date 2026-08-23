@echo off
echo ========================================================
echo Starting AI Document Assistant Backend (Spring Boot)...
echo ========================================================
cd /d %~dp0\backend
java -jar target\ai-document-assistant-1.0.0.jar
pause
