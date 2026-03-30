import { test } from "node:test";
import * as assert from "node:assert/strict";

class MemoryWritable {
  chunks = "";

  write(chunk: string | Uint8Array): boolean {
    this.chunks += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
    return true;
  }
}

test("main writes doctor json to stdout and returns success", async () => {
  const { main } = await import("../../src/cli/main.js");
  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();

  const exitCode = await main(["doctor", "--json"], { stdout, stderr });
  const parsed = JSON.parse(stdout.chunks) as { status?: string; checks?: unknown[] };

  assert.equal(exitCode, 0);
  assert.equal(stderr.chunks, "");
  assert.equal(parsed.status, "ok");
  assert.ok(Array.isArray(parsed.checks));
});

test("main writes usage to stderr and returns internal error when no command is provided", async () => {
  const { main } = await import("../../src/cli/main.js");
  const stdout = new MemoryWritable();
  const stderr = new MemoryWritable();

  const exitCode = await main([], { stdout, stderr });

  assert.equal(exitCode, 1);
  assert.equal(stdout.chunks, "");
  assert.match(stderr.chunks, /Usage: engine/);
});
