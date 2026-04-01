import path from "node:path";
import type {
  AdapterExecutionContext,
  AdapterExecutionResult,
} from "@paperclipai/adapter-utils";
import {
  asBoolean,
  asNumber,
  asString,
  asStringArray,
  buildPaperclipEnv,
  ensureAbsoluteDirectory,
  ensureCommandResolvable,
  ensurePathInEnv,
  joinPromptSections,
  parseObject,
  redactEnvForLogs,
  renderTemplate,
  runChildProcess,
} from "@paperclipai/adapter-utils/server-utils";
import { detectCopilotLoginRequired, parseCopilotOutput } from "./parse.js";

function readEnvConfig(
  config: Record<string, unknown>,
): Record<string, string> {
  const envConfig = parseObject(config.env);
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(envConfig)) {
    if (typeof value === "string") env[key] = value;
  }
  return env;
}

function buildTemplateData(
  ctx: AdapterExecutionContext,
): Record<string, unknown> {
  return {
    agent: ctx.agent,
    runId: ctx.runId,
    context: ctx.context,
    runtime: {
      sessionId: ctx.runtime.sessionId ?? "",
      sessionDisplayId: ctx.runtime.sessionDisplayId ?? "",
      taskKey: ctx.runtime.taskKey,
      ...parseObject(ctx.runtime.sessionParams),
    },
  };
}

export async function execute(
  ctx: AdapterExecutionContext,
): Promise<AdapterExecutionResult> {
  const {
    runId,
    agent,
    config,
    context,
    runtime,
    onLog,
    onMeta,
    onSpawn,
    authToken,
  } = ctx;
  const command = asString(config.command, "copilot");
  const configuredCwd = asString(config.cwd, "");
  const workspaceContext = parseObject(context.paperclipWorkspace);
  const workspaceCwd = asString(workspaceContext.cwd, "");
  const cwd = workspaceCwd || configuredCwd || process.cwd();
  await ensureAbsoluteDirectory(cwd, { createIfMissing: true });

  const promptTemplate = asString(
    config.promptTemplate,
    "You are agent {{agent.id}} ({{agent.name}}). Continue your Paperclip work.",
  );
  const bootstrapPromptTemplate = asString(config.bootstrapPromptTemplate, "");
  const model = asString(config.model, "").trim();
  const effort = asString(config.effort, "").trim();
  const dangerouslySkipPermissions = asBoolean(
    config.dangerouslySkipPermissions,
    false,
  );
  const timeoutSec = asNumber(config.timeoutSec, 0);
  const graceSec = asNumber(config.graceSec, 20);
  const maxTurns = asNumber(config.maxTurnsPerRun, 0);
  const extraArgs = (() => {
    const fromExtraArgs = asStringArray(config.extraArgs);
    if (fromExtraArgs.length > 0) return fromExtraArgs;
    return asStringArray(config.args);
  })();

  const env: Record<string, string> = {
    ...buildPaperclipEnv(agent),
    PAPERCLIP_RUN_ID: runId,
    ...readEnvConfig(config),
  };
  if (authToken && !env.PAPERCLIP_API_KEY) {
    env.PAPERCLIP_API_KEY = authToken;
  }

  const runtimeEnv = ensurePathInEnv({ ...process.env, ...env });
  await ensureCommandResolvable(command, cwd, runtimeEnv);

  const prompt = joinPromptSections([
    bootstrapPromptTemplate
      ? renderTemplate(bootstrapPromptTemplate, buildTemplateData(ctx))
      : "",
    renderTemplate(promptTemplate, buildTemplateData(ctx)),
  ]);

  const args = [
    "-p",
    prompt,
    "--output-format",
    "json",
    "--stream",
    "off",
    "--no-ask-user",
    "--allow-all-tools",
    "--add-dir",
    cwd,
  ];

  if (model) args.push("--model", model);
  if (effort) args.push("--effort", effort);
  if (dangerouslySkipPermissions) args.push("--allow-all");
  if (maxTurns > 0) args.push("--max-autopilot-continues", String(maxTurns));
  if (extraArgs.length > 0) args.push(...extraArgs);

  await onMeta?.({
    adapterType: "copilot",
    command,
    cwd,
    commandArgs: args,
    commandNotes: [
      "Runs GitHub Copilot CLI in non-interactive mode via `copilot -p`.",
      "Authentication is provided by `copilot login` or COPILOT_GITHUB_TOKEN/GH_TOKEN/GITHUB_TOKEN.",
    ],
    env: redactEnvForLogs(env),
    prompt,
    promptMetrics: {
      promptChars: prompt.length,
    },
    context: {
      runtimeSessionId: runtime.sessionId ?? null,
      workspaceCwd: workspaceCwd || null,
    },
  });

  const proc = await runChildProcess(runId, command, args, {
    cwd,
    env,
    timeoutSec,
    graceSec,
    onLog,
    onSpawn,
  });

  const parsed = parseCopilotOutput({
    stdout: proc.stdout,
    stderr: proc.stderr,
    configuredModel: model,
  });
  const requiresLogin = detectCopilotLoginRequired({
    stdout: proc.stdout,
    stderr: proc.stderr,
  });

  const sessionParams = parsed.sessionId
    ? {
        sessionId: parsed.sessionId,
        cwd,
      }
    : null;

  const inferredErrorMessage = (() => {
    if (proc.timedOut) return "Copilot run timed out";
    if (requiresLogin)
      return "Copilot authentication required. Run `copilot login`.";
    if ((proc.exitCode ?? 0) !== 0)
      return parsed.errorMessage ?? "Copilot run failed";
    return null;
  })();

  return {
    exitCode: proc.exitCode,
    signal: proc.signal,
    timedOut: proc.timedOut,
    ...(inferredErrorMessage ? { errorMessage: inferredErrorMessage } : {}),
    ...(parsed.usage ? { usage: parsed.usage } : {}),
    ...(sessionParams
      ? { sessionParams, sessionDisplayId: parsed.sessionId }
      : {}),
    provider: parsed.provider,
    model: parsed.model,
    biller: "github_copilot",
    billingType: "subscription",
    ...(parsed.resultJson ? { resultJson: parsed.resultJson } : {}),
    summary: parsed.summary,
  };
}
