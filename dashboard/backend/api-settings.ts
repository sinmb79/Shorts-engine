import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";

const CONFIG_FILES = [
  "engine.json",
  "shorts-config.json",
  "prompt-styles.json",
  "user-profile.json",
] as const;

export async function readDashboardSettings(
  rootDir = process.cwd(),
): Promise<Record<string, string>> {
  const configDir = path.join(rootDir, "config");
  const results: Record<string, string> = {};

  for (const fileName of CONFIG_FILES) {
    try {
      results[fileName] = await readFile(path.join(configDir, fileName), "utf8");
    } catch {
      // Ignore missing optional files for dashboard editing.
    }
  }

  return results;
}

export async function updateDashboardSettings(
  rootDir = process.cwd(),
  updates: Record<string, string>,
): Promise<void> {
  const configDir = path.join(rootDir, "config");
  await mkdir(configDir, { recursive: true });

  for (const [fileName, content] of Object.entries(updates)) {
    await writeFile(path.join(configDir, fileName), content, "utf8");
  }
}
