# Local Ollama + Paperclip Integration - Quick Start

## Your Setup

```
Your Laptop (Paperclip Control Center)
|- 10.4.19.56 (Office System 1) -> llama3.1:8b + codestral:7b
`- 10.4.17.51 (Office System 2) -> mistral:7b + deepseek-coder:6.7b
```

## Quick Start (3 Steps)

### Step 1: Prepare Office System 1 (10.4.19.56)

On that PC:
1. Install Ollama from https://ollama.ai
2. Copy scripts/setup-ollama-system1.bat
3. Run as Administrator and keep it open
4. Wait for model pulls (~10GB total)

This script:
- Sets OLLAMA_HOST=0.0.0.0:11434
- Pulls llama3.1:8b (~5GB)
- Pulls codestral:7b (~5GB)
- Starts ollama serve

### Step 2: Prepare Office System 2 (10.4.17.51)

On that PC:
1. Install Ollama from https://ollama.ai
2. Copy scripts/setup-ollama-system2.bat
3. Run as Administrator and keep it open
4. Wait for model pulls (~8.5GB total)

This script:
- Sets OLLAMA_HOST=0.0.0.0:11434
- Pulls mistral:7b (~4.5GB)
- Pulls deepseek-coder:6.7b (~4GB)
- Starts ollama serve

### Step 3: Configure Paperclip Agents (Laptop)

Run:

```powershell
cd "C:\Users\Ali Hamza\Desktop\paperclip-AI-Office"
.\scripts\init-ollama-setup.ps1
```

It will:
- Verify Paperclip API
- Check connectivity to both office systems
- Configure all 12 agents
- Split agents 6/6 across both systems

## 16GB VRAM Rule

- RTX 5080 16GB should stay on 7B/8B class models for reliable performance.
- Do not use 34B/70B models on this setup.

## Connectivity Test

```powershell
curl -X POST "http://10.4.19.56:11434/api/generate" `
  -H "Content-Type: application/json" `
  -d '{"model":"llama3.1:8b","prompt":"test","stream":false}'

curl -X POST "http://10.4.17.51:11434/api/generate" `
  -H "Content-Type: application/json" `
  -d '{"model":"mistral:7b","prompt":"test","stream":false}'
```

## Quick Troubleshooting

- Connection refused:
  - Confirm ollama serve is running on each office PC.
  - Allow ollama.exe and port 11434 in Windows Firewall.
- Model not found:
  - Run ollama list on the office PC and repull missing models.
- Low disk:
  - Keep at least 20GB free per office system.

## Test an Agent

```powershell
curl -X POST "http://localhost:3100/api/agents/5d9aedf8-8607-42fc-abcf-e5dea8d6294b/heartbeat/invoke" `
  -H "Content-Type: application/json" `
  -d '{}'
```

