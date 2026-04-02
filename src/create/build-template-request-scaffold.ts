import type { CreateResult } from "../domain/contracts.js";
import { buildRequestFromTemplate } from "../templates/preset-catalog.js";

export function buildTemplateRequestScaffold(
  templateId: string,
  outputPath: string,
): CreateResult {
  return {
    schema_version: "0.1",
    profile: templateId,
    output_path: outputPath,
    request: buildRequestFromTemplate(templateId),
  };
}
