export const type = "copilot";
export const label = "GitHub Copilot";

export const models = [
  { id: "claude-opus-4.6", label: "Claude Opus 4.6" },
  { id: "claude-sonnet-4.6", label: "Claude Sonnet 4.6" },
  { id: "claude-opus-4.5", label: "Claude Opus 4.5" },
  { id: "claude-sonnet-4", label: "Claude Sonnet 4" },
  { id: "claude-haiku-4.5", label: "Claude Haiku 4.5" },
  { id: "gpt-5.1", label: "GPT-5.1" },
  { id: "gpt-4.1", label: "GPT-4.1" },
];

export const agentConfigurationDoc = `# copilot agent configuration

Adapter: copilot

Use when:
- The agent should run via GitHub Copilot CLI authenticated with your GitHub account
- You want to leverage GitHub Copilot subscription billing
- The task requires Claude/OpenAI/Gemini models available in your Copilot plan

Don't use when:
- You want direct Anthropic API-key billing (use claude_local instead)
- You need model/provider features only available in other dedicated local CLIs
- GitHub Copilot CLI is not installed on the host (install with npm install -g @github/copilot)

Core fields:
- cwd (string, optional): default absolute working directory fallback for the agent process
- instructionsFilePath (string, optional): absolute path to a markdown instructions file injected at runtime
- model (string, optional): model id (e.g. claude-opus-4.6, gpt-5.1)
- effort (string, optional): reasoning effort passed via --effort (low|medium|high)
- promptTemplate (string, optional): run prompt template
- maxTurnsPerRun (number, optional): max turns for one run
- dangerouslySkipPermissions (boolean, optional): pass --allow-all
- command (string, optional): defaults to "copilot"
- extraArgs (string[], optional): additional CLI args
- env (object, optional): KEY=VALUE environment variables

Operational fields:
- timeoutSec (number, optional): run timeout in seconds
- graceSec (number, optional): SIGTERM grace period in seconds

Notes:
- Authenticate with copilot login or set COPILOT_GITHUB_TOKEN/GH_TOKEN/GITHUB_TOKEN.
- This adapter runs Copilot in non-interactive prompt mode (copilot -p) for automation.
- Billing is tracked as GitHub Copilot subscription usage.
`;
