import type { UIAdapterModule } from "../types";
import { parseCopilotStdoutLine } from "@paperclipai/adapter-copilot/ui";
import { CopilotConfigFields } from "./config-fields";
import { buildCopilotConfig } from "@paperclipai/adapter-copilot/ui";

export const copilotUIAdapter: UIAdapterModule = {
  type: "copilot",
  label: "GitHub Copilot",
  parseStdoutLine: parseCopilotStdoutLine,
  ConfigFields: CopilotConfigFields,
  buildAdapterConfig: buildCopilotConfig,
};
