import { readFile } from "node:fs/promises";
import * as path from "node:path";
import { getAsset, isSea } from "node:sea";
import { fileURLToPath } from "node:url";

export const DEFAULT_CONFIG_FILE_NAMES = [
  "engine.json",
  "shorts-config.json",
  "prompt-styles.json",
  "user-profile.json",
] as const;

export type DefaultConfigFileName = typeof DEFAULT_CONFIG_FILE_NAMES[number];

export async function getDefaultConfigAssetText(
  fileName: DefaultConfigFileName,
): Promise<string> {
  if (isSea()) {
    return getAsset(`config/${fileName}`, "utf8");
  }

  return readFile(path.join(resolveSourceConfigDir(), fileName), "utf8");
}

function resolveSourceConfigDir(): string {
  return path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../config",
  );
}
