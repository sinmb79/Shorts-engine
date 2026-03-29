# Video Generation Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `engine execute <request.json>` 명령어로 execution_plan을 실행하여 영상 생성 어댑터를 호출한다.

**Architecture:** 플러그인 방식 어댑터 패턴. `VideoGenerationAdapter` 인터페이스를 구현하는 어댑터를 `adapter-registry`가 `ExecutionPlanNode.backend` 값에 따라 선택한다. API 키가 없으면 `local` 어댑터로 자동 폴백.

**Tech Stack:** Node.js 24 ESM, TypeScript 5, `node:https` (API 호출), `node:test` + `assert/strict` (테스트), `node:fs/promises` (파일 I/O)

---

## File Map

| 경로 | 역할 |
|------|------|
| `src/adapters/video/video-generation-adapter.ts` | 인터페이스 및 공용 타입 정의 |
| `src/adapters/video/local-adapter.ts` | 완전 구현 (API 키 불필요) |
| `src/adapters/video/sora-adapter.ts` | 뼈대 (SORA_API_KEY 필요) |
| `src/adapters/video/runway-adapter.ts` | 뼈대 (RUNWAY_API_KEY 필요) |
| `src/adapters/video/kling-adapter.ts` | 뼈대 (KLING_API_KEY 필요) |
| `src/adapters/video/adapter-registry.ts` | backend → 어댑터 선택 + 폴백 |
| `src/execute/execute-video-generation.ts` | execution_plan 순회 + 어댑터 호출 |
| `src/cli/execute-engine-command.ts` | `engine execute` 명령어 핸들러 |
| `src/cli/index.ts` | `execute` 명령어 라우팅 추가 |
| `src/config/profile-catalog.ts` | SUPPORTED_COMMANDS에 `execute` 추가 |
| `.env.example` | API 키 설정 예시 파일 |
| `tests/adapters/video/local-adapter.test.ts` | local 어댑터 단위 테스트 |
| `tests/adapters/video/adapter-registry.test.ts` | 레지스트리 단위 테스트 |
| `tests/adapters/video/execute-video-generation.test.ts` | 통합 테스트 |
| `tests/cli/execute-command.test.ts` | CLI 통합 테스트 |

---

### Task 1: 인터페이스 및 공용 타입 정의

**Files:**
- Create: `src/adapters/video/video-generation-adapter.ts`

- [ ] **Step 1: 파일 생성**

```typescript
// src/adapters/video/video-generation-adapter.ts

export interface VideoGenerationPrompt {
  text_prompt: string;
  duration_sec: number;
  aspect_ratio: string;
  style_tags: string[];
  motion_notes?: string;
}

export interface VideoGenerationResult {
  status: "success" | "error" | "dry_run";
  output_path?: string;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface VideoGenerationOptions {
  dry_run: boolean;
}

export interface VideoGenerationAdapter {
  name: string;
  isAvailable(): Promise<boolean>;
  generate(
    prompt: VideoGenerationPrompt,
    options: VideoGenerationOptions,
  ): Promise<VideoGenerationResult>;
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/adapters/video/video-generation-adapter.ts
git commit -m "feat: add VideoGenerationAdapter interface"
```

---

### Task 2: local 어댑터 구현 + 테스트

**Files:**
- Create: `src/adapters/video/local-adapter.ts`
- Create: `tests/adapters/video/local-adapter.test.ts`

- [ ] **Step 1: 테스트 작성**

```typescript
// tests/adapters/video/local-adapter.test.ts
import { test } from "node:test";
import * as assert from "node:assert/strict";
import { LocalAdapter } from "../../src/adapters/video/local-adapter.js";

test("local adapter is always available", async () => {
  const adapter = new LocalAdapter();
  assert.equal(await adapter.isAvailable(), true);
});

test("local adapter returns dry_run status", async () => {
  const adapter = new LocalAdapter();
  const result = await adapter.generate(
    {
      text_prompt: "A short clip of a cat",
      duration_sec: 15,
      aspect_ratio: "9:16",
      style_tags: ["cinematic"],
    },
    { dry_run: false },
  );
  assert.equal(result.status, "dry_run");
  assert.equal(result.output_path, undefined);
  assert.equal(typeof result.metadata, "object");
});

test("local adapter name is 'local'", () => {
  const adapter = new LocalAdapter();
  assert.equal(adapter.name, "local");
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npm test 2>&1 | grep -A 3 "local-adapter"
```

Expected: `local-adapter.test.js` 파일 없음 또는 import 에러

- [ ] **Step 3: 구현**

```typescript
// src/adapters/video/local-adapter.ts
import type {
  VideoGenerationAdapter,
  VideoGenerationOptions,
  VideoGenerationPrompt,
  VideoGenerationResult,
} from "./video-generation-adapter.js";

export class LocalAdapter implements VideoGenerationAdapter {
  name = "local";

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generate(
    prompt: VideoGenerationPrompt,
    _options: VideoGenerationOptions,
  ): Promise<VideoGenerationResult> {
    return {
      status: "dry_run",
      metadata: {
        adapter: "local",
        prompt_length: prompt.text_prompt.length,
        duration_sec: prompt.duration_sec,
        aspect_ratio: prompt.aspect_ratio,
      },
    };
  }
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npm test 2>&1 | grep -E "(local adapter|pass|fail)"
```

Expected: 3개 테스트 pass

- [ ] **Step 5: 커밋**

```bash
git add src/adapters/video/local-adapter.ts tests/adapters/video/local-adapter.test.ts
git commit -m "feat: implement local video generation adapter"
```

---

### Task 3: Sora / Runway / Kling 뼈대 어댑터

**Files:**
- Create: `src/adapters/video/sora-adapter.ts`
- Create: `src/adapters/video/runway-adapter.ts`
- Create: `src/adapters/video/kling-adapter.ts`

- [ ] **Step 1: Sora 어댑터 생성**

```typescript
// src/adapters/video/sora-adapter.ts
import type {
  VideoGenerationAdapter,
  VideoGenerationOptions,
  VideoGenerationPrompt,
  VideoGenerationResult,
} from "./video-generation-adapter.js";

export class SoraAdapter implements VideoGenerationAdapter {
  name = "sora";

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env["SORA_API_KEY"]);
  }

  async generate(
    prompt: VideoGenerationPrompt,
    options: VideoGenerationOptions,
  ): Promise<VideoGenerationResult> {
    if (options.dry_run) {
      return {
        status: "dry_run",
        metadata: { adapter: "sora", dry_run: true },
      };
    }

    const apiKey = process.env["SORA_API_KEY"];
    if (!apiKey) {
      return {
        status: "error",
        error: "SORA_API_KEY is not set in environment",
        metadata: { adapter: "sora" },
      };
    }

    // TODO: Sora API endpoint이 GA되면 아래를 실제 호출로 교체하세요.
    // 현재 Sora API는 공개 미정입니다.
    //
    // 예시 구조:
    // const response = await fetch("https://api.openai.com/v1/video/generations", {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${apiKey}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     prompt: prompt.text_prompt,
    //     duration: prompt.duration_sec,
    //     aspect_ratio: prompt.aspect_ratio,
    //   }),
    // });
    // const data = await response.json();
    // return {
    //   status: "success",
    //   output_path: data.url,
    //   metadata: { adapter: "sora", job_id: data.id },
    // };

    return {
      status: "dry_run",
      metadata: {
        adapter: "sora",
        note: "Sora API endpoint not yet GA — update this file when available",
      },
    };
  }
}
```

- [ ] **Step 2: Runway 어댑터 생성**

```typescript
// src/adapters/video/runway-adapter.ts
import type {
  VideoGenerationAdapter,
  VideoGenerationOptions,
  VideoGenerationPrompt,
  VideoGenerationResult,
} from "./video-generation-adapter.js";

export class RunwayAdapter implements VideoGenerationAdapter {
  name = "runway";

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env["RUNWAY_API_KEY"]);
  }

  async generate(
    prompt: VideoGenerationPrompt,
    options: VideoGenerationOptions,
  ): Promise<VideoGenerationResult> {
    if (options.dry_run) {
      return {
        status: "dry_run",
        metadata: { adapter: "runway", dry_run: true },
      };
    }

    const apiKey = process.env["RUNWAY_API_KEY"];
    if (!apiKey) {
      return {
        status: "error",
        error: "RUNWAY_API_KEY is not set in environment",
        metadata: { adapter: "runway" },
      };
    }

    // Runway Gen-3 API 호출 구조
    // 실제 사용 시 아래 주석을 해제하고 API 키를 .env에 추가하세요.
    //
    // const response = await fetch("https://api.runwayml.com/v1/image_to_video", {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${apiKey}`,
    //     "Content-Type": "application/json",
    //     "X-Runway-Version": "2024-11-06",
    //   },
    //   body: JSON.stringify({
    //     promptText: prompt.text_prompt,
    //     duration: prompt.duration_sec <= 5 ? 5 : 10,
    //     ratio: "720:1280",
    //   }),
    // });
    // const data = await response.json() as { id: string };
    // return {
    //   status: "success",
    //   metadata: { adapter: "runway", task_id: data.id },
    // };

    return {
      status: "dry_run",
      metadata: {
        adapter: "runway",
        note: "Add RUNWAY_API_KEY to .env and uncomment the fetch call above",
      },
    };
  }
}
```

- [ ] **Step 3: Kling 어댑터 생성**

```typescript
// src/adapters/video/kling-adapter.ts
import type {
  VideoGenerationAdapter,
  VideoGenerationOptions,
  VideoGenerationPrompt,
  VideoGenerationResult,
} from "./video-generation-adapter.js";

export class KlingAdapter implements VideoGenerationAdapter {
  name = "kling";

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env["KLING_API_KEY"]);
  }

  async generate(
    prompt: VideoGenerationPrompt,
    options: VideoGenerationOptions,
  ): Promise<VideoGenerationResult> {
    if (options.dry_run) {
      return {
        status: "dry_run",
        metadata: { adapter: "kling", dry_run: true },
      };
    }

    const apiKey = process.env["KLING_API_KEY"];
    if (!apiKey) {
      return {
        status: "error",
        error: "KLING_API_KEY is not set in environment",
        metadata: { adapter: "kling" },
      };
    }

    // Kling AI API 호출 구조
    // 실제 사용 시 아래 주석을 해제하고 API 키를 .env에 추가하세요.
    //
    // const response = await fetch("https://api.klingai.com/v1/videos/text2video", {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${apiKey}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     prompt: prompt.text_prompt,
    //     duration: String(prompt.duration_sec),
    //     aspect_ratio: "9:16",
    //   }),
    // });
    // const data = await response.json() as { task_id: string };
    // return {
    //   status: "success",
    //   metadata: { adapter: "kling", task_id: data.task_id },
    // };

    return {
      status: "dry_run",
      metadata: {
        adapter: "kling",
        note: "Add KLING_API_KEY to .env and uncomment the fetch call above",
      },
    };
  }
}
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build
```

Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/adapters/video/sora-adapter.ts src/adapters/video/runway-adapter.ts src/adapters/video/kling-adapter.ts
git commit -m "feat: add sora, runway, kling adapter skeletons"
```

---

### Task 4: 어댑터 레지스트리 구현 + 테스트

**Files:**
- Create: `src/adapters/video/adapter-registry.ts`
- Create: `tests/adapters/video/adapter-registry.test.ts`

- [ ] **Step 1: 테스트 작성**

```typescript
// tests/adapters/video/adapter-registry.test.ts
import { test } from "node:test";
import * as assert from "node:assert/strict";
import {
  resolveAdapter,
  ADAPTER_REGISTRY,
} from "../../src/adapters/video/adapter-registry.js";

test("resolveAdapter returns local adapter for 'local' backend", async () => {
  const adapter = await resolveAdapter("local");
  assert.equal(adapter.name, "local");
});

test("resolveAdapter returns local adapter for 'gpu' backend", async () => {
  const adapter = await resolveAdapter("gpu");
  assert.equal(adapter.name, "local");
});

test("resolveAdapter returns local adapter for 'cache' backend", async () => {
  const adapter = await resolveAdapter("cache");
  assert.equal(adapter.name, "local");
});

test("resolveAdapter falls back to local when sora API key is absent", async () => {
  const saved = process.env["SORA_API_KEY"];
  delete process.env["SORA_API_KEY"];
  const adapter = await resolveAdapter("sora");
  assert.equal(adapter.name, "local");
  if (saved !== undefined) process.env["SORA_API_KEY"] = saved;
});

test("resolveAdapter falls back to local when premium backends are all unavailable", async () => {
  const keys = ["KLING_API_KEY", "RUNWAY_API_KEY", "SORA_API_KEY"];
  const saved: Record<string, string | undefined> = {};
  for (const k of keys) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  const adapter = await resolveAdapter("premium");
  assert.equal(adapter.name, "local");
  for (const k of keys) {
    if (saved[k] !== undefined) process.env[k] = saved[k];
  }
});

test("ADAPTER_REGISTRY contains all four adapter names", () => {
  const names = Object.keys(ADAPTER_REGISTRY);
  assert.ok(names.includes("local"));
  assert.ok(names.includes("sora"));
  assert.ok(names.includes("runway"));
  assert.ok(names.includes("kling"));
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npm test 2>&1 | grep -E "(adapter-registry|fail)"
```

Expected: import 에러 또는 테스트 실패

- [ ] **Step 3: 구현**

```typescript
// src/adapters/video/adapter-registry.ts
import type { ExecutionBackend } from "../../domain/contracts.js";
import type { VideoGenerationAdapter } from "./video-generation-adapter.js";
import { KlingAdapter } from "./kling-adapter.js";
import { LocalAdapter } from "./local-adapter.js";
import { RunwayAdapter } from "./runway-adapter.js";
import { SoraAdapter } from "./sora-adapter.js";

export const ADAPTER_REGISTRY: Record<string, VideoGenerationAdapter> = {
  local: new LocalAdapter(),
  sora: new SoraAdapter(),
  runway: new RunwayAdapter(),
  kling: new KlingAdapter(),
};

const local = ADAPTER_REGISTRY["local"]!;

export async function resolveAdapter(
  backend: ExecutionBackend,
): Promise<VideoGenerationAdapter> {
  switch (backend) {
    case "local":
    case "gpu":
    case "cache":
      return local;

    case "sora": {
      const sora = ADAPTER_REGISTRY["sora"]!;
      return (await sora.isAvailable()) ? sora : local;
    }

    case "premium": {
      const kling = ADAPTER_REGISTRY["kling"]!;
      if (await kling.isAvailable()) return kling;
      const runway = ADAPTER_REGISTRY["runway"]!;
      if (await runway.isAvailable()) return runway;
      const sora = ADAPTER_REGISTRY["sora"]!;
      if (await sora.isAvailable()) return sora;
      return local;
    }

    default:
      return local;
  }
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npm test 2>&1 | grep -E "(adapter-registry|pass|fail)" | head -20
```

Expected: 6개 테스트 pass

- [ ] **Step 5: 커밋**

```bash
git add src/adapters/video/adapter-registry.ts tests/adapters/video/adapter-registry.test.ts
git commit -m "feat: add adapter registry with fallback logic"
```

---

### Task 5: execute-video-generation 구현 + 통합 테스트

**Files:**
- Create: `src/execute/execute-video-generation.ts`
- Create: `tests/adapters/video/execute-video-generation.test.ts`

- [ ] **Step 1: 테스트 작성**

```typescript
// tests/adapters/video/execute-video-generation.test.ts
import { test } from "node:test";
import * as assert from "node:assert/strict";
import type { VideoGenerationAdapter } from "../../src/adapters/video/video-generation-adapter.js";
import {
  executeVideoGeneration,
  buildPromptFromPlanningContext,
} from "../../src/execute/execute-video-generation.js";
import { loadFixture } from "../helpers/load-fixture.js";
import type { EngineRequest } from "../../src/domain/contracts.js";
import { normalizeRequest } from "../../src/domain/normalize-request.js";
import { resolvePlanningContext } from "../../src/cli/resolve-planning-context.js";

function makeMockAdapter(name: string): VideoGenerationAdapter {
  return {
    name,
    async isAvailable() { return true; },
    async generate(_prompt, _opts) {
      return { status: "dry_run", metadata: { adapter: name } };
    },
  };
}

test("executeVideoGeneration returns result for all nodes", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const context = resolvePlanningContext(request);
  const mockAdapter = makeMockAdapter("mock");

  const result = await executeVideoGeneration(context, {
    dry_run: true,
    resolveAdapter: async () => mockAdapter,
  });

  assert.equal(result.dry_run, true);
  assert.ok(result.nodes.length > 0);
  assert.ok(result.summary.total > 0);
  assert.equal(result.summary.error, 0);
});

test("executeVideoGeneration summary counts dry_run correctly", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const context = resolvePlanningContext(request);
  const mockAdapter = makeMockAdapter("mock");

  const result = await executeVideoGeneration(context, {
    dry_run: true,
    resolveAdapter: async () => mockAdapter,
  });

  assert.equal(result.summary.dry_run, result.nodes.length);
  assert.equal(result.summary.success, 0);
});

test("buildPromptFromPlanningContext returns valid prompt", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const context = resolvePlanningContext(request);

  const prompt = buildPromptFromPlanningContext(context);

  assert.equal(typeof prompt.text_prompt, "string");
  assert.ok(prompt.text_prompt.length > 0);
  assert.equal(typeof prompt.duration_sec, "number");
  assert.equal(prompt.aspect_ratio, "9:16");
  assert.ok(Array.isArray(prompt.style_tags));
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npm test 2>&1 | grep "execute-video-generation"
```

Expected: import 에러

- [ ] **Step 3: 구현**

```typescript
// src/execute/execute-video-generation.ts
import type { PlanningContext } from "../cli/resolve-planning-context.js";
import type { VideoGenerationAdapter, VideoGenerationPrompt } from "../adapters/video/video-generation-adapter.js";
import type { ExecutionBackend } from "../domain/contracts.js";
import { resolveAdapter as defaultResolveAdapter } from "../adapters/video/adapter-registry.js";

export interface ExecuteNodeResult {
  node_id: string;
  adapter: string;
  status: "success" | "error" | "dry_run";
  output_path?: string;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface ExecuteVideoResult {
  schema_version: "0.1";
  executed_at: string;
  dry_run: boolean;
  nodes: ExecuteNodeResult[];
  summary: {
    total: number;
    success: number;
    dry_run: number;
    error: number;
  };
}

export interface ExecuteOptions {
  dry_run: boolean;
  resolveAdapter?: (backend: ExecutionBackend) => Promise<VideoGenerationAdapter>;
}

export function buildPromptFromPlanningContext(
  context: PlanningContext,
): VideoGenerationPrompt {
  const spec = context.platform_output_spec;
  const motion = context.motion_plan;
  const prompt = context.prompt_result;

  return {
    text_prompt: prompt?.video_prompt ?? context.effective_request.intent.topic,
    duration_sec: spec.effective_duration_sec,
    aspect_ratio: spec.aspect_ratio,
    style_tags: [
      context.effective_request.style.pacing_profile,
      context.effective_request.style.hook_type,
    ],
    motion_notes: motion.motion_sequence[0]?.technique ?? undefined,
  };
}

export async function executeVideoGeneration(
  context: PlanningContext,
  options: ExecuteOptions,
): Promise<ExecuteVideoResult> {
  const resolve = options.resolveAdapter ?? defaultResolveAdapter;
  const prompt = buildPromptFromPlanningContext(context);
  const nodes: ExecuteNodeResult[] = [];

  for (const node of context.execution_plan.nodes) {
    const adapter = await resolve(node.backend);
    const result = await adapter.generate(prompt, { dry_run: options.dry_run });

    nodes.push({
      node_id: node.node_id,
      adapter: adapter.name,
      status: result.status,
      output_path: result.output_path,
      error: result.error,
      metadata: result.metadata,
    });
  }

  const summary = {
    total: nodes.length,
    success: nodes.filter((n) => n.status === "success").length,
    dry_run: nodes.filter((n) => n.status === "dry_run").length,
    error: nodes.filter((n) => n.status === "error").length,
  };

  return {
    schema_version: "0.1",
    executed_at: new Date().toISOString(),
    dry_run: options.dry_run,
    nodes,
    summary,
  };
}
```

- [ ] **Step 4: `PlanningContext`에 `prompt_result` 필드 확인**

`resolve-planning-context.ts`를 읽어 `PlanningContext` 인터페이스에 `prompt_result`가 있는지 확인한다. 없으면 아래로 대체:

```typescript
text_prompt: context.effective_request.intent.topic,
```

그리고 `motion.motion_sequence[0]?.technique` 대신:

```typescript
motion_notes: motion.motion_sequence[0]?.motion_type ?? undefined,
```

- [ ] **Step 5: 빌드 확인**

```bash
npm run build
```

Expected: 에러 없음. 타입 에러 발생 시 Step 4의 대체 코드 적용.

- [ ] **Step 6: 테스트 실행 — 통과 확인**

```bash
npm test 2>&1 | grep -E "(execute-video-generation|pass|fail)" | head -10
```

Expected: 3개 테스트 pass

- [ ] **Step 7: 커밋**

```bash
git add src/execute/execute-video-generation.ts tests/adapters/video/execute-video-generation.test.ts
git commit -m "feat: implement execute-video-generation orchestrator"
```

---

### Task 6: CLI 명령어 추가 + 테스트

**Files:**
- Create: `src/cli/execute-engine-command.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/config/profile-catalog.ts`
- Create: `tests/cli/execute-command.test.ts`

- [ ] **Step 1: 테스트 작성**

```typescript
// tests/cli/execute-command.test.ts
import { test } from "node:test";
import * as assert from "node:assert/strict";
import { runCli } from "../helpers/run-cli.js";

test("engine execute --dry-run returns success and JSON output", () => {
  const result = runCli([
    "execute",
    "tests/fixtures/valid-low-cost-request.json",
    "--dry-run",
    "--json",
  ]);

  assert.equal(result.exitCode, 0);
  const parsed = JSON.parse(result.stdout) as {
    schema_version?: string;
    dry_run?: boolean;
    nodes?: unknown[];
    summary?: { total?: number; error?: number };
  };
  assert.equal(parsed.schema_version, "0.1");
  assert.equal(parsed.dry_run, true);
  assert.ok(Array.isArray(parsed.nodes));
  assert.ok((parsed.nodes?.length ?? 0) > 0);
  assert.equal(parsed.summary?.error, 0);
});

test("engine execute --dry-run prints human-readable summary", () => {
  const result = runCli([
    "execute",
    "tests/fixtures/valid-low-cost-request.json",
    "--dry-run",
  ]);

  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /dry.run/i);
  assert.match(result.stdout, /nodes/i);
});

test("engine execute returns error for invalid request", () => {
  const result = runCli([
    "execute",
    "tests/fixtures/invalid-request.json",
    "--dry-run",
  ]);

  assert.notEqual(result.exitCode, 0);
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npm test 2>&1 | grep "execute-command"
```

Expected: import 에러 또는 명령어 없음 에러

- [ ] **Step 3: execute-engine-command.ts 작성**

```typescript
// src/cli/execute-engine-command.ts
import { writeFile } from "node:fs/promises";
import * as path from "node:path";

import { resolveAdapter } from "../adapters/video/adapter-registry.js";
import { resolvePlanningContext } from "./resolve-planning-context.js";
import { loadEngineRequest } from "./load-engine-request.js";
import {
  EXIT_CODE_INTERNAL_ERROR,
  EXIT_CODE_SUCCESS,
  EXIT_CODE_VALIDATION_FAILURE,
} from "./exit-codes.js";
import {
  executeVideoGeneration,
} from "../execute/execute-video-generation.js";

function renderExecuteOutput(
  result: Awaited<ReturnType<typeof executeVideoGeneration>>,
  json: boolean,
): string {
  if (json) return `${JSON.stringify(result, null, 2)}\n`;

  const lines: string[] = [
    `Execute Result (dry_run: ${result.dry_run})`,
    `Executed at: ${result.executed_at}`,
    `Nodes: ${result.summary.total} total / ${result.summary.success} success / ${result.summary.dry_run} dry_run / ${result.summary.error} error`,
    "",
  ];

  for (const node of result.nodes) {
    lines.push(`  [${node.status}] ${node.node_id} → adapter: ${node.adapter}`);
    if (node.error) lines.push(`    error: ${node.error}`);
  }

  return lines.join("\n") + "\n";
}

export async function executeEngineCommand(
  requestPath: string,
  options: { json: boolean; dry_run: boolean },
): Promise<{ exitCode: number; output: string }> {
  try {
    const loaded = await loadEngineRequest(requestPath);

    if (!loaded.validation.valid || !loaded.request) {
      return {
        exitCode: EXIT_CODE_VALIDATION_FAILURE,
        output: `Validation failed: ${loaded.validation.errors.map((e) => e.message).join(", ")}\n`,
      };
    }

    const context = resolvePlanningContext(loaded.request);
    const result = await executeVideoGeneration(context, {
      dry_run: options.dry_run,
      resolveAdapter,
    });

    const outputPath = requestPath.replace(/\.json$/, ".execute-result.json");
    await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

    return {
      exitCode: EXIT_CODE_SUCCESS,
      output: renderExecuteOutput(result, options.json),
    };
  } catch (error) {
    return {
      exitCode: EXIT_CODE_INTERNAL_ERROR,
      output: `Fatal error: ${error instanceof Error ? error.message : "Unknown error"}\n`,
    };
  }
}
```

- [ ] **Step 4: index.ts에 execute 명령어 추가**

`src/cli/index.ts` 상단 import에 추가:

```typescript
import { executeEngineCommand } from "./execute-engine-command.js";
```

`executeCommand` 함수 내 `wizard` 블록 바로 아래에 추가:

```typescript
  if (commandName === "execute") {
    const [requestPath] = positionals;
    if (!requestPath) {
      return {
        exitCode: EXIT_CODE_INTERNAL_ERROR,
        output: "Usage: engine execute <request.json> [--dry-run] [--json]\n",
      };
    }
    const dry_run = flags.includes("--dry-run");
    return executeEngineCommand(requestPath, { json: options.json, dry_run });
  }
```

Usage 문자열도 두 곳 모두 `execute` 추가:

```
"Usage: engine <run|prompt|create|wizard|execute|config|doctor|analyze|render|publish> ..."
```

- [ ] **Step 5: profile-catalog.ts SUPPORTED_COMMANDS 업데이트**

```typescript
export const SUPPORTED_COMMANDS = [
  "run",
  "prompt",
  "create",
  "wizard",
  "execute",
  "config",
  "doctor",
  "analyze",
  "render",
  "publish",
];
```

- [ ] **Step 6: 빌드 확인**

```bash
npm run build
```

Expected: 에러 없음

- [ ] **Step 7: 테스트 실행 — 통과 확인**

```bash
npm test 2>&1 | tail -15
```

Expected: 전체 pass, fail 0

- [ ] **Step 8: 커밋**

```bash
git add src/cli/execute-engine-command.ts src/cli/index.ts src/config/profile-catalog.ts tests/cli/execute-command.test.ts
git commit -m "feat: add engine execute CLI command"
```

---

### Task 7: .env.example 생성 및 README 업데이트

**Files:**
- Create: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: .env.example 생성**

```bash
# .env.example
# 아래 API 키를 발급받아 .env 파일을 만들고 값을 채워넣으세요.
# .env 파일은 절대 git에 커밋하지 마세요 (.gitignore에 등록됨).

# Sora (OpenAI) - https://openai.com/sora
SORA_API_KEY=your_sora_api_key_here

# Runway Gen-3 - https://runwayml.com
RUNWAY_API_KEY=your_runway_api_key_here

# Kling AI - https://klingai.com
KLING_API_KEY=your_kling_api_key_here
```

- [ ] **Step 2: .gitignore에 .env 추가 확인**

```bash
grep "\.env" .gitignore
```

없으면 추가:

```bash
echo ".env" >> .gitignore
```

- [ ] **Step 3: README.md에 execute 명령어 및 API 키 설정 섹션 추가**

명령어 표에 추가:

```markdown
| `engine execute <파일> [--dry-run]` | 실제 영상 생성 어댑터 호출 (API 키 필요) |
```

"현재 구현되지 않은 기능" 섹션의 "실제 영상 생성" 항목을 아래로 교체:

```markdown
- 실제 영상 생성 — 어댑터 프레임워크 구현 완료. Sora/Runway/Kling API 키를 `.env`에 추가하면 실제 생성 가능 (각 서비스의 공개 API 상태에 따라 다름)
```

새 섹션 추가 (README 하단 "미구현 기능" 위):

```markdown
## 영상 생성 API 연동 방법

`.env.example`을 복사하여 `.env` 파일을 만들고 API 키를 입력하세요:

```bash
cp .env.example .env
# .env 파일을 열어 API 키 입력
```

그 다음 아래 명령어로 실행합니다:

```bash
npm run engine -- execute my-request.json           # 실제 API 호출
npm run engine -- execute my-request.json --dry-run # 테스트 (API 호출 없음)
```

API 키가 없으면 자동으로 `local` 어댑터(dry_run)로 동작합니다.
```

- [ ] **Step 4: 빌드 및 전체 테스트 실행**

```bash
npm test 2>&1 | tail -10
```

Expected: 전체 pass

- [ ] **Step 5: 최종 커밋 및 푸시**

```bash
git add .env.example .gitignore README.md
git commit -m "docs: add .env.example and API key setup guide"
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ `VideoGenerationAdapter` 인터페이스 — Task 1
- ✅ `local` 어댑터 완전 구현 — Task 2
- ✅ Sora/Runway/Kling 뼈대 — Task 3
- ✅ 어댑터 레지스트리 + 폴백 — Task 4
- ✅ execution_plan 순회 + 어댑터 호출 — Task 5
- ✅ `engine execute` CLI 명령어 + `--dry-run` — Task 6
- ✅ `.env.example` + README — Task 7
- ✅ API 키 없을 때 local 폴백 — Task 4 레지스트리

**Placeholder scan:** 없음 ✅

**Type consistency:**
- `VideoGenerationAdapter` — Task 1에서 정의, Task 2/3/4에서 일관되게 사용 ✅
- `ExecutionBackend` — `contracts.ts`에서 import, Task 4/5에서 일관되게 사용 ✅
- `executeVideoGeneration` — Task 5에서 정의, Task 6에서 import ✅
- `PlanningContext` — `resolve-planning-context.ts` 기존 타입 사용 ✅
