# Configure Paperclip Agents to Use Local Ollama Models
# Usage: .\configure-ollama-agents.ps1

$PAPERCLIP_API = "http://localhost:3100"
$COMPANY_ID = "e6d357e2-e4c6-4930-9e2f-8b124e7731c4"

# Office System IPs
$SYSTEM_1 = "10.4.19.56"  # Has: llama3.1:8b, codestral:7b
$SYSTEM_2 = "10.4.17.51"  # Has: mistral:7b, deepseek-coder:6.7b

# Agent configuration mapping
$AgentConfigs = @(
    @{
        id          = "5d9aedf8-8607-42fc-abcf-e5dea8d6294b"
        name        = "Sarah Mitchell"
        system      = $SYSTEM_1
        model       = "llama3.1:8b"
        description = "VP Sales - Strategy and reasoning"
    },
    @{
        id          = "0121bbd3-bd00-450e-b887-afa1e6416ac2"
        name        = "Daniel Reyes"
        system      = $SYSTEM_2
        model       = "mistral:7b"
        description = "SDR - Cold outreach"
    },
    @{
        id          = "7beb0abd-1ab6-45d6-9379-fa0c57ffdb9a"
        name        = "Aisha Patel"
        system      = $SYSTEM_1
        model       = "codestral:7b"
        description = "Solutions Engineer - Code-optimized"
    },
    @{
        id          = "ff5bfd42-991c-41ed-8ced-fe737e648868"
        name        = "ALI"
        system      = $SYSTEM_2
        model       = "mistral:7b"
        description = "CEO - Load balanced"
    },
    @{
        id          = "82e094ce-36e8-4354-8c9d-10c65d423816"
        name        = "Tom Nguyen"
        system      = $SYSTEM_1
        model       = "llama3.1:8b"
        description = "Engineer - System 1"
    },
    @{
        id          = "aeeacec5-e9ee-4e7b-ba1b-ce4c84ebc54a"
        name        = "Robert Chen"
        system      = $SYSTEM_2
        model       = "deepseek-coder:6.7b"
        description = "Engineer - System 2"
    },
    @{
        id          = "9751bc76-e0e0-4929-afca-1bd194010e32"
        name        = "Priya Sharma"
        system      = $SYSTEM_1
        model       = "codestral:7b"
        description = "Engineer - System 1"
    },
    @{
        id          = "69b3ad29-298e-44f6-a5b1-f4bca6032ba6"
        name        = "Nina Kowalski"
        system      = $SYSTEM_2
        model       = "mistral:7b"
        description = "Engineer - System 2"
    },
    @{
        id          = "67ad0e6a-25b5-4f4e-92a5-5b126d3c6a97"
        name        = "Marcus Webb"
        system      = $SYSTEM_1
        model       = "llama3.1:8b"
        description = "Engineer - System 1"
    },
    @{
        id          = "b22bfd1a-598e-4876-af1c-73e9b55863c6"
        name        = "Leo Fernandez"
        system      = $SYSTEM_2
        model       = "deepseek-coder:6.7b"
        description = "Engineer - System 2"
    },
    @{
        id          = "8eb4b6a1-6142-4754-aff8-1dff8900ac6a"
        name        = "James Okafor"
        system      = $SYSTEM_1
        model       = "codestral:7b"
        description = "Engineer - System 1"
    },
    @{
        id          = "cf033496-dc5c-4c06-af55-12d305c517a4"
        name        = "Hannah Clarke"
        system      = $SYSTEM_2
        model       = "mistral:7b"
        description = "Engineer - System 2"
    }
)

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Configuring Paperclip Agents for Local Ollama Models      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Test Connectivity
Write-Host "Step 1: Testing Connectivity to Ollama Servers" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────────────"

$s1_ok = $false
$s2_ok = $false

try {
    $response = Invoke-RestMethod -Method GET -Uri "http://$($SYSTEM_1):11434/api/tags" -TimeoutSec 5
    $s1_ok = $true
    Write-Host "✓ System 1 ($SYSTEM_1:11434) - ONLINE" -ForegroundColor Green
}
catch {
    Write-Host "✗ System 1 ($SYSTEM_1:11434) - OFFLINE" -ForegroundColor Red
}

try {
    $response = Invoke-RestMethod -Method GET -Uri "http://$($SYSTEM_2):11434/api/tags" -TimeoutSec 5
    $s2_ok = $true
    Write-Host "✓ System 2 ($SYSTEM_2:11434) - ONLINE" -ForegroundColor Green
}
catch {
    Write-Host "✗ System 2 ($SYSTEM_2:11434) - OFFLINE" -ForegroundColor Red
}

if (-not $s1_ok -or -not $s2_ok) {
    Write-Host ""
    Write-Host "⚠ WARNING: One or more Ollama servers are not reachable!" -ForegroundColor Yellow
    Write-Host "Make sure Ollama is running with OLLAMA_HOST=0.0.0.0:11434" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne 'y') { exit 1 }
}

Write-Host ""

# Step 2: Configure Agents
Write-Host "Step 2: Configuring Agents" -ForegroundColor Yellow
Write-Host "───────────────────────────"

$successCount = 0
$failCount = 0

foreach ($agent in $AgentConfigs) {
    $endpoint = "http://$($agent.system):11434/api/generate"
  
    $config = @{
        adapterType   = "http"
        adapterConfig = @{
            endpoint             = $endpoint
            headers              = @{
                "Content-Type" = "application/json"
            }
            template             = @{
                model  = $agent.model
                stream = $false
            }
            instructionsFilePath = "C:\Users\Ali Hamza\Desktop\paperclip-AI-Office\agentsmd\$($agent.name.ToLower() -replace ' ', '-').md"
        }
    } | ConvertTo-Json -Depth 10

    try {
        curl -s -X PATCH "$PAPERCLIP_API/api/agents/$($agent.id)" `
            -H "Content-Type: application/json" `
            -d $config | Out-Null
    
        Write-Host "✓ $($agent.name.PadRight(20)) → 10.4.$($agent.system.Split('.')[2..3] -join '.'):11434 ($($agent.model))" -ForegroundColor Green
        $successCount++
    }
    catch {
        Write-Host "✗ $($agent.name.PadRight(20)) - FAILED" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Configuration Complete                                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  ✓ Configured: $successCount agents" -ForegroundColor Green
Write-Host "  ✗ Failed: $failCount agents" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "Load Balancing:" -ForegroundColor Cyan
Write-Host "  System 1 (10.4.19.56): 6 agents (llama3.1:8b, codestral:7b)" -ForegroundColor White
Write-Host "  System 2 (10.4.17.51): 6 agents (mistral:7b, deepseek-coder:6.7b)" -ForegroundColor White
Write-Host ""
Write-Host "Next: Start the sales sprint with 'pnpm dev'" -ForegroundColor Yellow
