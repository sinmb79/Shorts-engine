import type { NarrativePayload } from "../domain/contracts.js";

export function renderScenarioOutput(result: NarrativePayload, json: boolean): string {
  if (json) {
    return JSON.stringify(result, null, 2);
  }

  const lines = [
    `Studio: ${result.studio_id}`,
    `Scene archetype: ${result.scene_archetype}`,
    `Philosophy note: ${result.philosophy_note}`,
    `Key prop: ${result.key_prop}`,
    `Key silence: ${result.key_silence_sec}s`,
    `Beat count: ${result.beats.length}`,
  ];

  return `${lines.join("\n")}\n`;
}
