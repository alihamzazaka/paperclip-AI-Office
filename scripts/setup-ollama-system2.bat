@echo off
REM Setup Ollama on Office System 2 (10.4.17.51)
REM Run this script on the second office PC

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  Ollama Setup - Office System 2 (10.4.17.51)               ║
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

REM Pull Mistral 7B (general tasks)
echo ⏳ Pulling mistral:7b (~4.5GB)...
ollama pull mistral:7b
if %errorlevel% neq 0 (
    echo ✗ Failed to pull mistral:7b
    pause
    exit /b 1
)
echo ✓ mistral:7b downloaded

REM Pull DeepSeek Coder 6.7B (coding tasks)
echo.
echo ⏳ Pulling deepseek-coder:6.7b (~4GB)...
ollama pull deepseek-coder:6.7b
if %errorlevel% neq 0 (
    echo ✗ Failed to pull deepseek-coder:6.7b
    pause
    exit /b 1
)
echo ✓ deepseek-coder:6.7b downloaded

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  Setup Complete - Starting Ollama Server                  ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Starting: ollama serve
echo Server will be available at: http://10.4.17.51:11434
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start Ollama with remote access enabled
set OLLAMA_HOST=0.0.0.0:11434
ollama serve

pause
