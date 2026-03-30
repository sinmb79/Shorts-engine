import { mkdir } from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

export function resolvePortableBundlePaths(rootDir = process.cwd()) {
  const seaDir = path.join(rootDir, ".sea");

  return {
    seaDir,
    bundlePath: path.join(seaDir, "engine.bundle.cjs"),
  };
}

export async function buildPortableBundle(rootDir = process.cwd()) {
  const { seaDir, bundlePath } = resolvePortableBundlePaths(rootDir);

  await mkdir(seaDir, { recursive: true });
  await build({
    entryPoints: [path.join(rootDir, "src", "cli", "portable-entry.ts")],
    outfile: bundlePath,
    bundle: true,
    platform: "node",
    target: "node24",
    format: "cjs",
    sourcemap: false,
    legalComments: "none",
    logOverride: {
      "empty-import-meta": "silent",
    },
  });

  return {
    seaDir,
    bundlePath,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const result = await buildPortableBundle();
  process.stdout.write(`${result.bundlePath}\n`);
}
