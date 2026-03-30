import * as path from "node:path";
import { spawn } from "node:child_process";

import { EXIT_CODE_INTERNAL_ERROR, EXIT_CODE_SUCCESS } from "./exit-codes.js";
import { createDashboardServer } from "../../dashboard/backend/server.js";

export async function dashboardEngineCommand(
  options: { json: boolean },
): Promise<{ exitCode: number; output: string }> {
  const rootDir = process.cwd();
  const requestedPort = Number.parseInt(process.env["SHORTS_ENGINE_DASHBOARD_PORT"] ?? "8099", 10);
  const shouldOpen = process.env["SHORTS_ENGINE_DASHBOARD_NO_OPEN"] !== "1";
  const once = process.env["SHORTS_ENGINE_DASHBOARD_ONCE"] === "1";
  const server = createDashboardServer({ rootDir });

  try {
    const listening = await server.start(Number.isNaN(requestedPort) ? 8099 : requestedPort);

    if (shouldOpen) {
      openBrowser(`${listening.url}/dashboard`);
    }

    const payload = {
      started: true,
      url: listening.url,
      frontend_dir: path.join(rootDir, "dashboard", "frontend"),
    };

    if (once) {
      await server.close();
      return {
        exitCode: EXIT_CODE_SUCCESS,
        output: options.json
          ? `${JSON.stringify(payload, null, 2)}\n`
          : `Dashboard ready at ${payload.url}\n`,
      };
    }

    return await new Promise((resolve) => {
      const message = options.json
        ? `${JSON.stringify(payload, null, 2)}\n`
        : `Dashboard server started at ${payload.url}\nPress Ctrl+C to stop.\n`;
      const shutdown = async () => {
        process.off("SIGINT", shutdown);
        process.off("SIGTERM", shutdown);
        await server.close();
        resolve({
          exitCode: EXIT_CODE_SUCCESS,
          output: message,
        });
      };

      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
    });
  } catch (error) {
    return {
      exitCode: EXIT_CODE_INTERNAL_ERROR,
      output: `Fatal error: ${error instanceof Error ? error.message : "Unknown error"}\n`,
    };
  }
}

function openBrowser(url: string): void {
  try {
    if (process.platform === "win32") {
      spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
      return;
    }

    if (process.platform === "darwin") {
      spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
      return;
    }

    spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
  } catch {
    // Browser launch failure should not crash dashboard startup.
  }
}
