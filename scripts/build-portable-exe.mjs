import { copyFile, mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

import { buildPortableBundle, resolvePortableBundlePaths } from "./build-cli-bundle.mjs";

const require = createRequire(import.meta.url);
const CONFIG_ASSET_FILES = [
  "engine.json",
  "shorts-config.json",
  "prompt-styles.json",
  "user-profile.json",
];
const NODE_SEA_SENTINEL_FUSE = "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2";

export function resolvePortableExePlan(rootDir = process.cwd()) {
  const { seaDir, bundlePath } = resolvePortableBundlePaths(rootDir);
  const releaseDir = path.join(rootDir, "release");
  const outputPath = path.join(releaseDir, "shorts-engine-win-x64.exe");
  const seaConfigPath = path.join(seaDir, "sea-config.json");
  const prepBlobPath = path.join(seaDir, "sea-prep.blob");
  const assets = Object.fromEntries(
    CONFIG_ASSET_FILES.map((fileName) => [
      `config/${fileName}`,
      path.join(rootDir, "config", fileName),
    ]),
  );

  return {
    buildMode: detectSeaBuildMode(),
    seaDir,
    releaseDir,
    bundlePath,
    outputPath,
    seaConfigPath,
    prepBlobPath,
    assets,
  };
}

export async function writeSeaConfig(rootDir = process.cwd()) {
  const plan = resolvePortableExePlan(rootDir);

  await mkdir(plan.seaDir, { recursive: true });
  await mkdir(plan.releaseDir, { recursive: true });

  const seaConfig = plan.buildMode === "build-sea"
    ? {
        main: plan.bundlePath,
        output: plan.outputPath,
        disableExperimentalSEAWarning: true,
        assets: plan.assets,
      }
    : {
        main: plan.bundlePath,
        output: plan.prepBlobPath,
        disableExperimentalSEAWarning: true,
        assets: plan.assets,
      };

  await writeFile(plan.seaConfigPath, `${JSON.stringify(seaConfig, null, 2)}\n`, "utf8");
  return plan;
}

export async function buildPortableExe(rootDir = process.cwd()) {
  const plan = await writeSeaConfig(rootDir);
  await buildPortableBundle(rootDir);
  if (plan.buildMode === "build-sea") {
    await runCommand(process.execPath, ["--build-sea", plan.seaConfigPath]);
    return plan;
  }

  await runCommand(process.execPath, ["--experimental-sea-config", plan.seaConfigPath]);
  await copyFile(process.execPath, plan.outputPath);
  await runCommand(process.execPath, [
    require.resolve("postject/dist/cli.js"),
    plan.outputPath,
    "NODE_SEA_BLOB",
    plan.prepBlobPath,
    "--sentinel-fuse",
    NODE_SEA_SENTINEL_FUSE,
  ]);
  return plan;
}

function detectSeaBuildMode(nodeVersion = process.versions.node) {
  const [majorText, minorText] = nodeVersion.split(".");
  const major = Number(majorText);
  const minor = Number(minorText);

  if (Number.isFinite(major) && Number.isFinite(minor)) {
    if (major > 25 || (major === 25 && minor >= 5)) {
      return "build-sea";
    }
  }

  return "legacy-postject";
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed with exit code ${code ?? 1}`));
    });
  });
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const json = args.includes("--json");
const plan = dryRun ? await writeSeaConfig() : await buildPortableExe();

if (json) {
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
} else {
  process.stdout.write(`${plan.outputPath}\n`);
}
