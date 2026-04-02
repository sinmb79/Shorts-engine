import { formatCapcut } from "./capcut.js";
import { formatGeneric } from "./generic.js";
import { formatHuman } from "./human.js";
import { formatKling } from "./kling.js";
import { formatPika } from "./pika.js";
import { formatRunway } from "./runway.js";
import { formatVeo } from "./veo.js";
import type { FormattedOutput, FormatterContext, OutputFormatName } from "./types.js";

export const SUPPORTED_OUTPUT_FORMATS: OutputFormatName[] = [
  "kling",
  "runway",
  "veo",
  "pika",
  "capcut",
  "generic",
  "human",
];

export function resolveOutputSelection(value?: string | null): OutputFormatName | "all" {
  if (!value || value.trim() === "") {
    return "generic";
  }

  if (value === "all") {
    return "all";
  }

  if (SUPPORTED_OUTPUT_FORMATS.includes(value as OutputFormatName)) {
    return value as OutputFormatName;
  }

  throw new Error(`Unsupported output format: ${value}`);
}

export function buildFormattedOutputs(
  context: FormatterContext,
  selection: OutputFormatName | "all",
): FormattedOutput[] {
  const formats = selection === "all" ? SUPPORTED_OUTPUT_FORMATS : [selection];
  return formats.map((format) => buildSingleFormattedOutput(context, format));
}

function buildSingleFormattedOutput(
  context: FormatterContext,
  format: OutputFormatName,
): FormattedOutput {
  switch (format) {
    case "kling":
      return formatKling(context);
    case "runway":
      return formatRunway(context);
    case "veo":
      return formatVeo(context);
    case "pika":
      return formatPika(context);
    case "capcut":
      return formatCapcut(context);
    case "human":
      return formatHuman(context);
    case "generic":
    default:
      return formatGeneric(context);
  }
}
