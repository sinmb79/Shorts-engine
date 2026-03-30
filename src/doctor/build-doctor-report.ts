import { access } from "node:fs/promises";
import * as path from "node:path";

import { TTS_ADAPTER_REGISTRY } from "../adapters/tts/tts-adapter-registry.js";
import { UPLOAD_ADAPTER_REGISTRY } from "../adapters/upload/upload-adapter-registry.js";
import { ADAPTER_REGISTRY } from "../adapters/video/adapter-registry.js";
import type { DoctorCheck, DoctorResult, DoctorStatus } from "../domain/contracts.js";
import { SUPPORTED_COMMANDS } from "../config/profile-catalog.js";

export async function buildDoctorReport(): Promise<DoctorResult> {
  const checks: DoctorCheck[] = [];

  checks.push({
    name: "node_version",
    status: isSupportedNodeVersion(process.versions.node) ? "ok" : "warning",
    message: `Detected Node ${process.versions.node}`,
  });

  checks.push(await checkPath("package_json", path.resolve(process.cwd(), "package.json")));
  checks.push(await checkPath("fixtures_directory", path.resolve(process.cwd(), "tests", "fixtures")));
  checks.push(buildCatalogCheck("command_catalog", SUPPORTED_COMMANDS, ["stats", "dashboard", "init"]));
  checks.push(buildCatalogCheck("video_adapters", Object.keys(ADAPTER_REGISTRY), ["veo3", "seedance2", "local"]));
  checks.push(buildCatalogCheck("tts_adapters", Object.keys(TTS_ADAPTER_REGISTRY), ["edge_tts", "local", "openai_tts"]));
  checks.push(buildCatalogCheck("upload_adapters", Object.keys(UPLOAD_ADAPTER_REGISTRY), ["youtube", "tiktok", "instagram", "local"]));

  const status = deriveOverallStatus(checks);

  return {
    schema_version: "0.1",
    status,
    checks,
    warnings: checks.filter((check) => check.status !== "ok").map((check) => check.name),
  };
}

async function checkPath(name: string, targetPath: string): Promise<DoctorCheck> {
  try {
    await access(targetPath);
    return {
      name,
      status: "ok",
      message: `${name} available`,
    };
  } catch {
    return {
      name,
      status: "error",
      message: `${name} missing`,
    };
  }
}

function buildCatalogCheck(
  name: string,
  items: string[],
  requiredItems: string[],
): DoctorCheck {
  const normalizedItems = [...new Set(items)].sort();
  const missingItems = requiredItems.filter((item) => !normalizedItems.includes(item));

  return {
    name,
    status: missingItems.length === 0 ? "ok" : "warning",
    message: missingItems.length === 0
      ? normalizedItems.join(", ")
      : `missing: ${missingItems.join(", ")} | available: ${normalizedItems.join(", ")}`,
  };
}

function isSupportedNodeVersion(version: string): boolean {
  const major = Number(version.split(".")[0]);
  return Number.isFinite(major) && major >= 24;
}

function deriveOverallStatus(checks: DoctorCheck[]): DoctorStatus {
  if (checks.some((check) => check.status === "error")) {
    return "error";
  }

  if (checks.some((check) => check.status === "warning")) {
    return "warning";
  }

  return "ok";
}
