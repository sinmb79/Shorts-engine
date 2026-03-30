import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import * as path from "node:path";

import { getDashboardAnalytics } from "./api-analytics.js";
import { getDashboardCostBreakdown } from "./api-cost.js";
import { getDashboardOverview } from "./api-overview.js";
import { readDashboardSettings, updateDashboardSettings } from "./api-settings.js";
import { PromptTracker } from "../../src/tracking/prompt-tracker.js";

export interface DashboardServer {
  start(port?: number): Promise<{ port: number; url: string }>;
  close(): Promise<void>;
}

export function createDashboardServer(options?: {
  rootDir?: string;
  promptDbPath?: string;
}): DashboardServer {
  const rootDir = options?.rootDir ?? process.cwd();
  const trackerPath = options?.promptDbPath;
  const tracker = new PromptTracker(trackerPath);
  const server = createServer(async (request, response) => {
    try {
      await routeDashboardRequest(request, response, {
        rootDir,
        ...(trackerPath ? { trackerPath } : {}),
        tracker,
      });
    } catch (error) {
      writeJson(response, 500, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return {
    start(port = 8099) {
      return new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, "127.0.0.1", () => {
          const address = server.address();
          if (address && typeof address === "object") {
            resolve({
              port: address.port,
              url: `http://127.0.0.1:${address.port}`,
            });
          } else {
            reject(new Error("Dashboard server address unavailable"));
          }
        });
      });
    },
    close() {
      return new Promise((resolve, reject) => {
        tracker.close();
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}

async function routeDashboardRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: {
    rootDir: string;
    trackerPath?: string;
    tracker: PromptTracker;
  },
): Promise<void> {
  const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");

  if (request.method === "GET" && requestUrl.pathname === "/api/overview") {
    writeJson(response, 200, getDashboardOverview({ tracker: options.tracker }));
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/analytics") {
    writeJson(response, 200, getDashboardAnalytics({ tracker: options.tracker }));
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/cost") {
    writeJson(response, 200, getDashboardCostBreakdown({ tracker: options.tracker }));
    return;
  }

  if (requestUrl.pathname === "/api/settings") {
    if (request.method === "GET") {
      writeJson(response, 200, await readDashboardSettings(options.rootDir));
      return;
    }

    if (request.method === "POST") {
      const payload = await readJsonBody(request) as Record<string, string>;
      await updateDashboardSettings(options.rootDir, payload);
      writeJson(response, 200, { updated: true });
      return;
    }
  }

  if (request.method === "GET" && (requestUrl.pathname === "/" || requestUrl.pathname === "/dashboard")) {
    writeHtml(response, 200, renderDashboardHome(options.rootDir));
    return;
  }

  writeJson(response, 404, { error: "Not found" });
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString("utf8");
  return body === "" ? {} : JSON.parse(body);
}

function renderDashboardHome(rootDir: string): string {
  const frontendDir = path.join(rootDir, "dashboard", "frontend");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Shorts Engine Dashboard</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; background: #0d1321; color: #f5f7ff; }
      a { color: #75c2ff; }
      code { background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; }
    </style>
  </head>
  <body>
    <h1>Shorts Engine Dashboard</h1>
    <p>Backend API is running. Frontend scaffold is located at <code>${frontendDir}</code>.</p>
    <ul>
      <li><a href="/api/overview">Overview API</a></li>
      <li><a href="/api/analytics">Analytics API</a></li>
      <li><a href="/api/settings">Settings API</a></li>
      <li><a href="/api/cost">Cost API</a></li>
    </ul>
  </body>
</html>`;
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload, null, 2));
}

function writeHtml(response: ServerResponse, statusCode: number, html: string): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "text/html; charset=utf-8");
  response.end(html);
}
