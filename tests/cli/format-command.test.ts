import * as assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { test } from "node:test";

import { runCli } from "../helpers/run-cli.js";

test("format returns a copy-ready formatter payload in JSON", () => {
  const result = runCli([
    "format",
    "tests/fixtures/valid-low-cost-request.json",
    "--output",
    "kling",
    "--json",
  ]);
  const parsed = JSON.parse(result.stdout) as {
    format?: string;
    title?: string;
    content?: string;
    metadata?: { platform?: string };
  };

  assert.equal(result.exitCode, 0);
  assert.equal(parsed.format, "kling");
  assert.equal(parsed.metadata?.platform, "youtube_shorts");
  assert.match(parsed.content ?? "", /KLING MASTER PROMPT/);
});

test("format applies trend hashtags when trend-aware mode is enabled", () => {
  const tempDir = mkdtempSync(path.join(process.cwd(), "tmp-format-trends-"));
  const trendPath = path.join(tempDir, "trend-index.json");

  try {
    writeFileSync(
      trendPath,
      `${JSON.stringify(
        {
          trends: [
            { keyword: "workflow", hashtag: "#workflow", platforms: ["youtube_shorts"] },
            { keyword: "automation", hashtag: "#automation", platforms: ["youtube_shorts"] },
          ],
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    const result = runCli(
      [
        "format",
        "tests/fixtures/valid-low-cost-request.json",
        "--output",
        "generic",
        "--trend-aware",
        "--json",
      ],
      {
        env: {
          SHORTS_ENGINE_TRENDS_PATH: trendPath,
        },
      },
    );
    const parsed = JSON.parse(result.stdout) as {
      metadata?: { hashtags?: string[] };
      content?: string;
    };

    assert.equal(result.exitCode, 0);
    assert.ok(parsed.metadata?.hashtags?.includes("#workflow"));
    assert.match(parsed.content ?? "", /Trend hashtags:/);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
