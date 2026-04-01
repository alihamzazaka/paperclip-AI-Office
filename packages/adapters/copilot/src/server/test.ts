import type {
  AdapterEnvironmentCheck,
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
} from "@paperclipai/adapter-utils";
import {
  asString,
  parseObject,
  ensureAbsoluteDirectory,
  ensureCommandResolvable,
  ensurePathInEnv,
  runChildProcess,
} from "@paperclipai/adapter-utils/server-utils";
import { detectCopilotLoginRequired, summarizeProbeDetail } from "./parse.js";

function summarizeStatus(
  checks: AdapterEnvironmentCheck[],
): AdapterEnvironmentTestResult["status"] {
  if (checks.some((check) => check.level === "error")) return "fail";
  if (checks.some((check) => check.level === "warn")) return "warn";
  return "pass";
}

function hasNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function testEnvironment(
  ctx: AdapterEnvironmentTestContext,
): Promise<AdapterEnvironmentTestResult> {
  const checks: AdapterEnvironmentCheck[] = [];
  const config = parseObject(ctx.config);
  const command = asString(config.command, "copilot");
  const cwd = asString(config.cwd, process.cwd());
  const model = asString(config.model, "").trim();
  const effort = asString(config.effort, "").trim();

  try {
    await ensureAbsoluteDirectory(cwd, { createIfMissing: true });
    checks.push({
      code: "copilot_cwd_valid",
      level: "info",
      message: `Working directory is valid: ${cwd}`,
    });
  } catch (err) {
    checks.push({
      code: "copilot_cwd_invalid",
      level: "error",
      message: err instanceof Error ? err.message : "Invalid working directory",
      detail: cwd,
    });
  }

  const envConfig = parseObject(config.env);
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(envConfig)) {
    if (typeof value === "string") env[key] = value;
  }
  const runtimeEnv = ensurePathInEnv({ ...process.env, ...env });

  try {
    await ensureCommandResolvable(command, cwd, runtimeEnv);
    checks.push({
      code: "copilot_command_resolvable",
      level: "info",
      message: `Command is executable: ${command}`,
    });
  } catch (err) {
    checks.push({
      code: "copilot_command_unresolvable",
      level: "error",
      message: err instanceof Error ? err.message : "Command is not executable",
      detail: command,
      hint: "Install CLI with `npm install -g @github/copilot`.",
    });
  }

  const tokenFromConfig =
    env.COPILOT_GITHUB_TOKEN || env.GH_TOKEN || env.GITHUB_TOKEN;
  const tokenFromHost =
    process.env.COPILOT_GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_TOKEN;
  if (hasNonEmpty(tokenFromConfig) || hasNonEmpty(tokenFromHost)) {
    const source = hasNonEmpty(tokenFromConfig)
      ? "adapter config env"
      : "server environment";
    checks.push({
      code: "copilot_token_detected",
      level: "info",
      message: "Copilot authentication token detected.",
      detail: `Detected in ${source}.`,
    });
  } else {
    checks.push({
      code: "copilot_token_not_detected",
      level: "info",
      message:
        "No Copilot token env var detected; local Copilot CLI login will be used if available.",
      hint: "Run `copilot login` in this environment if the hello probe asks for authentication.",
    });
  }

  const canRunProbe = checks.every(
    (check) =>
      check.code !== "copilot_cwd_invalid" &&
      check.code !== "copilot_command_unresolvable",
  );
  if (canRunProbe) {
    const args = [
      "-p",
      "Respond with hello.",
      "--silent",
      "--output-format",
      "text",
      "--stream",
      "off",
      "--no-ask-user",
      "--allow-all-tools",
      "--add-dir",
      cwd,
    ];
    // Don't pass --model to the hello probe; it only checks CLI connectivity.
    // The agent's chosen model may not be available and would mask an auth pass.
    if (effort) args.push("--effort", effort);

    const probe = await runChildProcess(
      `copilot-envtest-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      command,
      args,
      {
        cwd,
        env,
        timeoutSec: 45,
        graceSec: 5,
        onLog: async () => {},
      },
    );

    const loginRequired = detectCopilotLoginRequired({
      stdout: probe.stdout,
      stderr: probe.stderr,
    });
    const detail = summarizeProbeDetail(probe.stdout, probe.stderr);

    if (probe.timedOut) {
      checks.push({
        code: "copilot_hello_probe_timed_out",
        level: "warn",
        message: "Copilot hello probe timed out.",
        hint: "Retry the probe. If this persists, run the manual debug command below.",
      });
    } else if (loginRequired) {
      checks.push({
        code: "copilot_hello_probe_auth_required",
        level: "warn",
        message: "Copilot CLI is installed, but authentication is required.",
        ...(detail ? { detail } : {}),
        hint: "Run `copilot login` and retry.",
      });
    } else if ((probe.exitCode ?? 1) === 0) {
      const summary = probe.stdout.replace(/\s+/g, " ").trim();
      const hasHello = /\bhello\b/i.test(summary);
      checks.push({
        code: hasHello
          ? "copilot_hello_probe_passed"
          : "copilot_hello_probe_unexpected_output",
        level: hasHello ? "info" : "warn",
        message: hasHello
          ? "Copilot hello probe succeeded."
          : "Copilot probe ran but did not return `hello` as expected.",
        ...(summary ? { detail: summary.slice(0, 240) } : {}),
        ...(hasHello
          ? {}
          : {
              hint: "Try the manual debug command and inspect output format for this model.",
            }),
      });
    } else {
      checks.push({
        code: "copilot_hello_probe_failed",
        level: "error",
        message: "Copilot hello probe failed.",
        ...(detail ? { detail } : {}),
        hint: 'Run `copilot -p "Respond with hello." --silent --output-format text --stream off --no-ask-user --allow-all-tools` manually to debug.',
      });
    }
  }

  return {
    adapterType: "copilot",
    status: summarizeStatus(checks),
    checks,
    testedAt: new Date().toISOString(),
  };
}
