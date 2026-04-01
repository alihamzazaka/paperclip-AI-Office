# ONE-COMMAND Setup for Local Ollama + Paperclip
# Run this on your LAPTOP from PowerShell

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Paperclip + Local Ollama - Complete Setup                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Step 1: Verify Paperclip is running
Write-Host "Step 1: Checking Paperclip API..." -ForegroundColor Yellow
try {
    $health = curl -s "http://localhost:3100/api/health" | ConvertFrom-Json
    Write-Host "✓ Paperclip API is running (http://localhost:3100)" -ForegroundColor Green
}
catch {
    Write-Host "✗ Paperclip is not running!" -ForegroundColor Red
    Write-Host "   Start it first: pnpm dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Visual instructions for office systems
Write-Host "Step 2: Setup Office Systems" -ForegroundColor Yellow
Write-Host "────────────────────────────" -ForegroundColor Yellow

Write-Host ""
Write-Host "ON OFFICE SYSTEM 1 (10.4.19.56):" -ForegroundColor Magenta
Write-Host "  1. Copy: scripts\setup-ollama-system1.bat to that PC" -ForegroundColor White
Write-Host "  2. Run it as Administrator" -ForegroundColor White
Write-Host "  3. Leave it running (don't close)" -ForegroundColor White
Write-Host "  4. It will download ~10GB of models" -ForegroundColor White
Write-Host ""

Write-Host "ON OFFICE SYSTEM 2 (10.4.17.51):" -ForegroundColor Magenta
Write-Host "  1. Copy: scripts\setup-ollama-system2.bat to that PC" -ForegroundColor White
Write-Host "  2. Run it as Administrator" -ForegroundColor White
Write-Host "  3. Leave it running (don't close)" -ForegroundColor White
Write-Host "  4. It will download ~8.5GB of models" -ForegroundColor White
Write-Host ""

Write-Host "Step 3: Test Connectivity" -ForegroundColor Yellow
Write-Host "────────────────────────"

Write-Host ""
Write-Host "Press ENTER once both office systems show 'ollama serve' is running..." -ForegroundColor Cyan
Read-Host | Out-Null

# Test System 1
Write-Host ""
Write-Host "Testing System 1 (10.4.19.56)..." -ForegroundColor White
try {
    $response = curl -s -X POST "http://10.4.19.56:11434/api/generate" `
        -H "Content-Type: application/json" `
        -d '{"model":"llama3.1:8b","prompt":"test","stream":false}' -m 5

    if ($response) {
        Write-Host "✓ System 1 is reachable and responding" -ForegroundColor Green
    }
    else {
        Write-Host "✗ System 1 responded but with empty data" -ForegroundColor Red
    }
}
catch {
    Write-Host "✗ System 1 is not reachable (check firewall)" -ForegroundColor Red
}

# Test System 2
Write-Host ""
Write-Host "Testing System 2 (10.4.17.51)..." -ForegroundColor White
try {
    $response = curl -s -X POST "http://10.4.17.51:11434/api/generate" `
        -H "Content-Type: application/json" `
        -d '{"model":"mistral:7b","prompt":"test","stream":false}' -m 5

    if ($response) {
        Write-Host "✓ System 2 is reachable and responding" -ForegroundColor Green
    }
    else {
        Write-Host "✗ System 2 responded but with empty data" -ForegroundColor Red
    }
}
catch {
    Write-Host "✗ System 2 is not reachable (check firewall)" -ForegroundColor Red
}

Write-Host ""

# Step 4: Configure agents
Write-Host "Step 4: Configuring Agents" -ForegroundColor Yellow
Write-Host "──────────────────────────"

Write-Host ""
Write-Host "Running: .\scripts\configure-ollama-agents.ps1" -ForegroundColor Cyan

& ".\scripts\configure-ollama-agents.ps1"

Write-Host ""

# Step 5: Next steps
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✓ SETUP COMPLETE                                         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host ""
Write-Host "Your Paperclip agents are now configured to use LOCAL MODELS:" -ForegroundColor Green
Write-Host "  • System 1: Llama 3.1 (8B), Codestral (7B)" -ForegroundColor White
Write-Host "  • System 2: Mistral (7B), DeepSeek Coder (6.7B)" -ForegroundColor White
Write-Host ""

Write-Host "Load Distribution:" -ForegroundColor Green
Write-Host "  Sarah Mitchell     → 10.4.19.56 (Llama 3.1)" -ForegroundColor White
Write-Host "  Daniel Reyes       → 10.4.17.51 (Mistral 7B)" -ForegroundColor White
Write-Host "  Aisha Patel        → 10.4.19.56 (Codestral)" -ForegroundColor White
Write-Host "  ALI                → 10.4.17.51 (Mistral 7B)" -ForegroundColor White
Write-Host "  Others             → Balanced across both systems" -ForegroundColor White
Write-Host ""

Write-Host "Ready to start the sales sprint!" -ForegroundColor Green
Write-Host ""
Write-Host "Test with:" -ForegroundColor Cyan
Write-Host "  curl -X POST 'http://localhost:3100/api/agents/5d9aedf8-8607-42fc-abcf-e5dea8d6294b/heartbeat/invoke' -H 'Content-Type: application/json' -d '{}'" -ForegroundColor Gray
Write-Host ""
