# Local Ollama Setup for Paperclip Agents

## Architecture

```
Laptop (Paperclip)
|- API/UI: http://localhost:3100
|- Routes agent requests to remote Ollama servers
|
+- Office System 1 (10.4.19.56)
|  |- GPU: RTX 5080 16GB
|  `- Models: llama3.1:8b, codestral:7b
|
`- Office System 2 (10.4.17.51)
   |- GPU: RTX 5080 16GB
   `- Models: mistral:7b, deepseek-coder:6.7b
```

## 16GB VRAM Constraint

- Use 7B/8B models for stable execution.
- Do not use 34B/70B models on RTX 5080 16GB.

## Step 1: Install Ollama on Office Systems

Windows:
1. Download https://ollama.ai/download
2. Install and restart

## Step 2: Enable Remote Access

On each office PC:

```powershell
setx OLLAMA_HOST 0.0.0.0:11434 /M
```

Open a new terminal and run:

```powershell
ollama serve
```

## Step 3: Pull Correct Models

System 1 (10.4.19.56):

```powershell
ollama pull llama3.1:8b
ollama pull codestral:7b
```

System 2 (10.4.17.51):

```powershell
ollama pull mistral:7b
ollama pull deepseek-coder:6.7b
```

Disk guidance:
- System 1: ~10GB
- System 2: ~8.5GB
- Keep at least 20GB free on each machine

## Step 4: Verify Connectivity from Laptop

```powershell
curl -X POST "http://10.4.19.56:11434/api/generate" `
  -H "Content-Type: application/json" `
  -d '{"model":"llama3.1:8b","prompt":"health check","stream":false}'

curl -X POST "http://10.4.17.51:11434/api/generate" `
  -H "Content-Type: application/json" `
  -d '{"model":"mistral:7b","prompt":"health check","stream":false}'
```

## Step 5: Configure All Paperclip Agents

From repo root on laptop:

```powershell
.\scripts\configure-ollama-agents.ps1
```

The script configures:
- 6 agents on System 1 with llama3.1:8b or codestral:7b
- 6 agents on System 2 with mistral:7b or deepseek-coder:6.7b

## Step 6: End-to-End Test

```powershell
curl -X POST "http://localhost:3100/api/agents/5d9aedf8-8607-42fc-abcf-e5dea8d6294b/heartbeat/invoke" `
  -H "Content-Type: application/json" `
  -d '{}'
```

## Troubleshooting

| Issue | Fix |
|---|---|
| Connection refused | Confirm ollama serve is running and firewall allows 11434 |
| Model not found | Run ollama list and repull missing model |
| Timeout | Validate LAN reachability between laptop and office systems |
| Slow generation | Use model already mapped in scripts and avoid oversized contexts |

