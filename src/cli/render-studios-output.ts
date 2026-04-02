import type { StudioDefinition } from "../domain/contracts.js";

export function renderStudiosListOutput(result: StudioDefinition[], json: boolean): string {
  if (json) {
    return JSON.stringify(
      result.map((studio) => ({
        studio_id: studio.studio_id,
        display_name: studio.display_name,
        philosophy_summary: studio.philosophy_summary,
      })),
      null,
      2,
    );
  }

  const lines = result.map(
    (studio) => `${studio.studio_id}: ${studio.display_name} - ${studio.philosophy_summary}`,
  );

  return `${lines.join("\n")}\n`;
}

export function renderStudioDetailOutput(result: StudioDefinition, json: boolean): string {
  if (json) {
    return JSON.stringify(result, null, 2);
  }

  const lines = [
    `Studio: ${result.display_name} (${result.studio_id})`,
    `Philosophy: ${result.philosophy_summary}`,
    `Archetypes: ${result.scene_archetypes.map((item) => item.name).join(", ")}`,
  ];

  return `${lines.join("\n")}\n`;
}
