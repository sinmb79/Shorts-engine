import { spawnSync } from "node:child_process";
import * as path from "node:path";

export function runCli(
  args: string[],
  options: { env?: NodeJS.ProcessEnv; input?: string } = {},
) {
  const cliPath = path.resolve(process.cwd(), "dist", "src", "cli", "index.js");

  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      ...options.env,
    },
    input: options.input,
  });

  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
