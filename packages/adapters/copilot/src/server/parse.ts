import type { UsageSummary } from "@paperclipai/adapter-utils";

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function firstNonEmptyLine(text: string): string {
  return (
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? ""
  );
}

function normalizeSummary(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  const max = 1000;
  return compact.length > max ? `${compact.slice(0, max - 1)}…` : compact;
}

function collectText(value: unknown): string[] {
  if (typeof value === "string") {
    const cleaned = normalizeSummary(value);
    return cleaned ? [cleaned] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectText(item));
  }
  const record = asRecord(value);
  if (!record) return [];

  const keys = [
    "text",
    "message",
    "content",
    "response",
    "output",
    "summary",
    "result",
  ];
  const parts: string[] = [];
  for (const key of keys) {
    if (key in record) {
      parts.push(...collectText(record[key]));
    }
  }
  return parts;
}

function parseUsage(record: Record<string, unknown>): UsageSummary | null {
  const usage =
    asRecord(record.usage) ??
    asRecord(record.tokenUsage) ??
    asRecord(record.tokens);
  if (!usage) return null;
  const inputTokens =
    asNumber(usage.inputTokens) ||
    asNumber(usage.input_tokens) ||
    asNumber(usage.promptTokens) ||
    asNumber(usage.input);
  const outputTokens =
    asNumber(usage.outputTokens) ||
    asNumber(usage.output_tokens) ||
    asNumber(usage.completionTokens) ||
    asNumber(usage.output);
  const cachedInputTokens =
    asNumber(usage.cachedInputTokens) ||
    asNumber(usage.cached_input_tokens) ||
    asNumber(usage.cacheReadTokens);
  if (inputTokens <= 0 && outputTokens <= 0 && cachedInputTokens <= 0)
    return null;
  return {
    inputTokens,
    outputTokens,
    ...(cachedInputTokens > 0 ? { cachedInputTokens } : {}),
  };
}

function pickProviderFromModel(model: string): string | null {
  const m = model.trim().toLowerCase();
  if (!m) return null;
  if (m.includes("claude")) return "anthropic";
  if (m.startsWith("gpt") || m.startsWith("o")) return "openai";
  if (m.includes("gemini")) return "google";
  return null;
}

export function detectCopilotLoginRequired(input: {
  stdout: string;
  stderr: string;
}): boolean {
  const text = `${input.stdout}\n${input.stderr}`.toLowerCase();
  return (
    text.includes("copilot login") ||
    text.includes("authenticate with copilot") ||
    text.includes("oauth") ||
    text.includes("not authenticated") ||
    text.includes("authentication required")
  );
}

export function summarizeProbeDetail(
  stdout: string,
  stderr: string,
): string | null {
  const raw = firstNonEmptyLine(stderr) || firstNonEmptyLine(stdout);
  if (!raw) return null;
  const cleaned = normalizeSummary(raw);
  return cleaned || null;
}

export function parseCopilotOutput(input: {
  stdout: string;
  stderr: string;
  configuredModel?: string;
}) {
  const lines = input.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const objects = lines
    .map((line) => asRecord(safeJsonParse(line)))
    .filter((value): value is Record<string, unknown> => value !== null);

  const usage =
    objects
      .map((obj) => parseUsage(obj))
      .find((value): value is UsageSummary => value !== null) ?? null;
  const modelFromOutput =
    objects
      .map((obj) => asString(obj.model))
      .find((value) => value.trim().length > 0) ??
    input.configuredModel ??
    "";
  const providerFromOutput =
    objects
      .map((obj) => asString(obj.provider))
      .find((value) => value.trim().length > 0) ??
    pickProviderFromModel(modelFromOutput);
  const sessionId =
    objects
      .map(
        (obj) =>
          asString(obj.sessionId) ||
          asString(obj.session_id) ||
          asString(obj.id),
      )
      .find((value) => value.trim().length > 0) ?? null;

  const summaryParts = objects.flatMap((obj) => collectText(obj));
  const summaryFromJson = normalizeSummary(summaryParts.join("\n").trim());
  const summaryFromText = normalizeSummary(input.stdout);
  const summary =
    summaryFromJson ||
    summaryFromText ||
    normalizeSummary(firstNonEmptyLine(input.stderr));

  const errorMessage =
    normalizeSummary(firstNonEmptyLine(input.stderr)) ||
    (detectCopilotLoginRequired(input)
      ? "Copilot authentication required"
      : "");

  return {
    summary: summary || null,
    usage,
    provider: providerFromOutput || null,
    model: modelFromOutput || null,
    sessionId,
    errorMessage: errorMessage || null,
    resultJson: objects.length > 0 ? objects[objects.length - 1] : null,
  };
}
