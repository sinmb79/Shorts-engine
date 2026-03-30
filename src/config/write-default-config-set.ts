import { mkdir, access, writeFile } from "node:fs/promises";
import * as path from "node:path";
import {
  DEFAULT_CONFIG_FILE_NAMES,
  getDefaultConfigAssetText,
} from "./default-config-assets.js";

export async function writeDefaultConfigSet(targetRoot: string): Promise<void> {
  const targetConfigDir = path.join(targetRoot, "config");

  await mkdir(targetConfigDir, { recursive: true });

  for (const fileName of DEFAULT_CONFIG_FILE_NAMES) {
    const destination = path.join(targetConfigDir, fileName);

    try {
      await access(destination);
      continue;
    } catch {
      const text = await getDefaultConfigAssetText(fileName);
      await writeFile(destination, text, "utf8");
    }
  }
}
