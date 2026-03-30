import { spawnSync } from "node:child_process";
import * as path from "node:path";

export function runCli(args: string[], options?: { cwd?: string; env?: NodeJS.ProcessEnv }) {
  const repoRoot = process.cwd();
  const cliPath = path.resolve(repoRoot, "dist", "src", "cli", "index.js");

  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: options?.cwd ?? repoRoot,
    encoding: "utf8",
    env: { ...process.env, ...options?.env },
  });

  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
