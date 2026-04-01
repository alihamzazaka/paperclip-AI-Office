@echo off
REM Setup Ollama on Office System 1 (10.4.19.56)
REM Run this script on the first office PC

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  Ollama Setup - Office System 1 (10.4.19.56)               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Ollama is installed
where ollama >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ✗ Ollama is not installed!
    echo.
    echo Download and install from: https://ollama.ai
    echo.
    pause
    exit /b 1
)

echo ✓ Ollama is installed
echo.

REM Set environment variable for remote access
echo Setting OLLAMA_HOST=0.0.0.0:11434...
set OLLAMA_HOST=0.0.0.0:11434

echo.
echo Pulling models for 16GB VRAM (this will take 10-20 minutes)...
echo.

REM Pull Llama 3.1 8B (general reasoning)
echo ⏳ Pulling llama3.1:8b (~5GB)...
ollama pull llama3.1:8b
if %errorlevel% neq 0 (
    echo ✗ Failed to pull llama3.1:8b
    pause
    exit /b 1
)
echo ✓ llama3.1:8b downloaded

REM Pull Codestral 7B (code-focused)
echo.
echo ⏳ Pulling codestral:7b (~5GB)...
ollama pull codestral:7b
if %errorlevel% neq 0 (
    echo ✗ Failed to pull codestral:7b
    pause
    exit /b 1
)
echo ✓ codestral:7b downloaded

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  Setup Complete - Starting Ollama Server                  ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Starting: ollama serve
echo Server will be available at: http://10.4.19.56:11434
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start Ollama with remote access enabled
set OLLAMA_HOST=0.0.0.0:11434
ollama serve

pause
