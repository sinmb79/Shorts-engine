# TTS Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `engine tts <request.json>` 명령어로 execution_plan을 실행해 TTS 어댑터를 통해 나레이션 오디오 파일을 생성한다.

**Architecture:** 1단계 영상 생성 어댑터와 동일한 플러그인 패턴. `TtsAdapter` 인터페이스를 구현하는 어댑터를 `tts-adapter-registry`가 `ExecutionPlanNode.backend` 값에 따라 선택. API 키 없으면 `local`로 자동 폴백.

**Tech Stack:** Node.js 24 ESM, TypeScript 5, `node:https` (API 호출), `node:test` + `assert/strict` (테스트)

---

## File Map

| 경로 | 역할 |
|------|------|
| `src/adapters/tts/tts-adapter.ts` | 인터페이스 및 공용 타입 |
| `src/adapters/tts/local-tts-adapter.ts` | 완전 구현 (API 키 불필요) |
| `src/adapters/tts/elevenlabs-adapter.ts` | 뼈대 (ELEVENLABS_API_KEY) |
| `src/adapters/tts/openai-tts-adapter.ts` | 뼈대 (OPENAI_API_KEY) |
| `src/adapters/tts/google-tts-adapter.ts` | 뼈대 (GOOGLE_TTS_API_KEY) |
| `src/adapters/tts/tts-adapter-registry.ts` | backend → 어댑터 선택 + 폴백 |
| `src/execute/execute-tts.ts` | execution_plan 순회 + TTS 어댑터 호출 |
| `src/cli/tts-engine-command.ts` | `engine tts` 명령어 핸들러 |
| `src/cli/index.ts` | `tts` 명령어 라우팅 추가 |
| `src/config/profile-catalog.ts` | SUPPORTED_COMMANDS에 `tts` 추가 |
| `.env.example` | TTS API 키 설정 예시 추가 |
| `tests/adapters/tts/local-tts-adapter.test.ts` | local 어댑터 단위 테스트 |
| `tests/adapters/tts/tts-adapter-registry.test.ts` | 레지스트리 단위 테스트 |
| `tests/adapters/tts/execute-tts.test.ts` | 통합 테스트 |
| `tests/cli/tts-command.test.ts` | CLI 통합 테스트 |

---

### Task 1: TtsAdapter 인터페이스 정의

**Files:**
- Create: `src/adapters/tts/tts-adapter.ts`

- [ ] **Step 1: 파일 생성**

```typescript
// src/adapters/tts/tts-adapter.ts

export type VoiceStyle = "neutral" | "energetic" | "dramatic";

export interface TtsRequest {
  text: string;
  language: string;
  voice_style: VoiceStyle;
  duration_hint_sec: number;
}

export interface TtsResult {
  status: "success" | "error" | "dry_run";
  output_path?: string;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface TtsOptions {
  dry_run: boolean;
  output_dir?: string;
}

export interface TtsAdapter {
  name: string;
  isAvailable(): Promise<boolean>;
  synthesize(request: TtsRequest, options: TtsOptions): Promise<TtsResult>;
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/adapters/tts/tts-adapter.ts
git commit -m "feat: add TtsAdapter interface"
```

---

### Task 2: local TTS 어댑터 구현 + 테스트

**Files:**
- Create: `src/adapters/tts/local-tts-adapter.ts`
- Create: `tests/adapters/tts/local-tts-adapter.test.ts`

- [ ] **Step 1: 테스트 작성**

```typescript
// tests/adapters/tts/local-tts-adapter.test.ts
import { test } from "node:test";
import * as assert from "node:assert/strict";
import { LocalTtsAdapter } from "../../../src/adapters/tts/local-tts-adapter.js";

test("local TTS adapter is always available", async () => {
  const adapter = new LocalTtsAdapter();
  assert.equal(await adapter.isAvailable(), true);
});

test("local TTS adapter returns dry_run status", async () => {
  const adapter = new LocalTtsAdapter();
  const result = await adapter.synthesize(
    {
      text: "Hello world",
      language: "en",
      voice_style: "neutral",
      duration_hint_sec: 15,
    },
    { dry_run: false },
  );
  assert.equal(result.status, "dry_run");
  assert.equal(result.output_path, undefined);
  assert.equal(typeof result.metadata, "object");
});

test("local TTS adapter name is 'local'", () => {
  const adapter = new LocalTtsAdapter();
  assert.equal(adapter.name, "local");
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npm test 2>&1 | grep "local-tts-adapter"
```

Expected: import 에러

- [ ] **Step 3: 구현**

```typescript
// src/adapters/tts/local-tts-adapter.ts
import type {
  TtsAdapter,
  TtsOptions,
  TtsRequest,
  TtsResult,
} from "./tts-adapter.js";

export class LocalTtsAdapter implements TtsAdapter {
  name = "local";

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async synthesize(
    request: TtsRequest,
    _options: TtsOptions,
  ): Promise<TtsResult> {
    return {
      status: "dry_run",
      metadata: {
        adapter: "local",
        text_length: request.text.length,
        language: request.language,
        voice_style: request.voice_style,
        duration_hint_sec: request.duration_hint_sec,
      },
    };
  }
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npm test 2>&1 | grep -E "(local TTS|pass|fail)" | head -10
```

Expected: 3개 테스트 pass

- [ ] **Step 5: 커밋**

```bash
git add src/adapters/tts/local-tts-adapter.ts tests/adapters/tts/local-tts-adapter.test.ts
git commit -m "feat: implement local TTS adapter"
```

---

### Task 3: ElevenLabs / OpenAI / Google TTS 뼈대 어댑터

**Files:**
- Create: `src/adapters/tts/elevenlabs-adapter.ts`
- Create: `src/adapters/tts/openai-tts-adapter.ts`
- Create: `src/adapters/tts/google-tts-adapter.ts`

- [ ] **Step 1: ElevenLabs 어댑터 생성**

```typescript
// src/adapters/tts/elevenlabs-adapter.ts
import type {
  TtsAdapter,
  TtsOptions,
  TtsRequest,
  TtsResult,
} from "./tts-adapter.js";

export class ElevenLabsAdapter implements TtsAdapter {
  name = "elevenlabs";

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env["ELEVENLABS_API_KEY"]);
  }

  async synthesize(
    request: TtsRequest,
    options: TtsOptions,
  ): Promise<TtsResult> {
    if (options.dry_run) {
      return {
        status: "dry_run",
        metadata: { adapter: "elevenlabs", dry_run: true },
      };
    }

    const apiKey = process.env["ELEVENLABS_API_KEY"];
    if (!apiKey) {
      return {
        status: "error",
        error: "ELEVENLABS_API_KEY is not set in environment",
        metadata: { adapter: "elevenlabs" },
      };
    }

    // ElevenLabs TTS API 호출 구조
    // 실제 사용 시 아래 주석을 해제하고 API 키를 .env에 추가하세요.
    //
    // const voiceId = "21m00Tcm4TlvDq8ikWAM"; // Rachel (기본 음성)
    // const response = await fetch(
    //   `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "xi-api-key": apiKey,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       text: request.text,
    //       model_id: "eleven_multilingual_v2",
    //       voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    //     }),
    //   },
    // );
    // const buffer = await response.arrayBuffer();
    // const outputPath = `${options.output_dir ?? "."}/tts-output.mp3`;
    // await writeFile(outputPath, Buffer.from(buffer));
    // return {
    //   status: "success",
    //   output_path: outputPath,
    //   metadata: { adapter: "elevenlabs", voice_id: voiceId },
    // };

    return {
      status: "dry_run",
      metadata: {
        adapter: "elevenlabs",
        note: "Add ELEVENLABS_API_KEY to .env and uncomment the fetch call above",
      },
    };
  }
}
```

- [ ] **Step 2: OpenAI TTS 어댑터 생성**

```typescript
// src/adapters/tts/openai-tts-adapter.ts
import type {
  TtsAdapter,
  TtsOptions,
  TtsRequest,
  TtsResult,
} from "./tts-adapter.js";

export class OpenAiTtsAdapter implements TtsAdapter {
  name = "openai_tts";

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env["OPENAI_API_KEY"]);
  }

  async synthesize(
    request: TtsRequest,
    options: TtsOptions,
  ): Promise<TtsResult> {
    if (options.dry_run) {
      return {
        status: "dry_run",
        metadata: { adapter: "openai_tts", dry_run: true },
      };
    }

    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) {
      return {
        status: "error",
        error: "OPENAI_API_KEY is not set in environment",
        metadata: { adapter: "openai_tts" },
      };
    }

    // OpenAI TTS API 호출 구조
    // 실제 사용 시 아래 주석을 해제하고 API 키를 .env에 추가하세요.
    //
    // const voice = request.voice_style === "dramatic" ? "onyx" : "nova";
    // const response = await fetch("https://api.openai.com/v1/audio/speech", {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${apiKey}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     model: "tts-1",
    //     input: request.text,
    //     voice,
    //   }),
    // });
    // const buffer = await response.arrayBuffer();
    // const outputPath = `${options.output_dir ?? "."}/tts-output.mp3`;
    // await writeFile(outputPath, Buffer.from(buffer));
    // return {
    //   status: "success",
    //   output_path: outputPath,
    //   metadata: { adapter: "openai_tts", voice },
    // };

    return {
      status: "dry_run",
      metadata: {
        adapter: "openai_tts",
        note: "Add OPENAI_API_KEY to .env and uncomment the fetch call above",
      },
    };
  }
}
```

- [ ] **Step 3: Google TTS 어댑터 생성**

```typescript
// src/adapters/tts/google-tts-adapter.ts
import type {
  TtsAdapter,
  TtsOptions,
  TtsRequest,
  TtsResult,
} from "./tts-adapter.js";

export class GoogleTtsAdapter implements TtsAdapter {
  name = "google_tts";

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env["GOOGLE_TTS_API_KEY"]);
  }

  async synthesize(
    request: TtsRequest,
    options: TtsOptions,
  ): Promise<TtsResult> {
    if (options.dry_run) {
      return {
        status: "dry_run",
        metadata: { adapter: "google_tts", dry_run: true },
      };
    }

    const apiKey = process.env["GOOGLE_TTS_API_KEY"];
    if (!apiKey) {
      return {
        status: "error",
        error: "GOOGLE_TTS_API_KEY is not set in environment",
        metadata: { adapter: "google_tts" },
      };
    }

    // Google Cloud TTS API 호출 구조
    // 실제 사용 시 아래 주석을 해제하고 API 키를 .env에 추가하세요.
    //
    // const langCode = request.language === "ko" ? "ko-KR" : "en-US";
    // const response = await fetch(
    //   `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    //   {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       input: { text: request.text },
    //       voice: { languageCode: langCode, ssmlGender: "NEUTRAL" },
    //       audioConfig: { audioEncoding: "MP3" },
    //     }),
    //   },
    // );
    // const data = await response.json() as { audioContent: string };
    // const outputPath = `${options.output_dir ?? "."}/tts-output.mp3`;
    // await writeFile(outputPath, Buffer.from(data.audioContent, "base64"));
    // return {
    //   status: "success",
    //   output_path: outputPath,
    //   metadata: { adapter: "google_tts", language_code: langCode },
    // };

    return {
      status: "dry_run",
      metadata: {
        adapter: "google_tts",
        note: "Add GOOGLE_TTS_API_KEY to .env and uncomment the fetch call above",
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
git add src/adapters/tts/elevenlabs-adapter.ts src/adapters/tts/openai-tts-adapter.ts src/adapters/tts/google-tts-adapter.ts
git commit -m "feat: add elevenlabs, openai-tts, google-tts adapter skeletons"
```

---

### Task 4: TTS 어댑터 레지스트리 + 테스트

**Files:**
- Create: `src/adapters/tts/tts-adapter-registry.ts`
- Create: `tests/adapters/tts/tts-adapter-registry.test.ts`

- [ ] **Step 1: 테스트 작성**

```typescript
// tests/adapters/tts/tts-adapter-registry.test.ts
import { test } from "node:test";
import * as assert from "node:assert/strict";
import {
  resolveTtsAdapter,
  TTS_ADAPTER_REGISTRY,
} from "../../../src/adapters/tts/tts-adapter-registry.js";

test("resolveTtsAdapter returns local for 'local' backend", async () => {
  const adapter = await resolveTtsAdapter("local");
  assert.equal(adapter.name, "local");
});

test("resolveTtsAdapter returns local for 'gpu' backend", async () => {
  const adapter = await resolveTtsAdapter("gpu");
  assert.equal(adapter.name, "local");
});

test("resolveTtsAdapter returns local for 'cache' backend", async () => {
  const adapter = await resolveTtsAdapter("cache");
  assert.equal(adapter.name, "local");
});

test("resolveTtsAdapter falls back to local when sora backend has no OPENAI_API_KEY", async () => {
  const saved = process.env["OPENAI_API_KEY"];
  delete process.env["OPENAI_API_KEY"];
  const adapter = await resolveTtsAdapter("sora");
  assert.equal(adapter.name, "local");
  if (saved !== undefined) process.env["OPENAI_API_KEY"] = saved;
});

test("resolveTtsAdapter falls back to local when premium backends all unavailable", async () => {
  const keys = ["ELEVENLABS_API_KEY", "OPENAI_API_KEY", "GOOGLE_TTS_API_KEY"];
  const saved: Record<string, string | undefined> = {};
  for (const k of keys) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  const adapter = await resolveTtsAdapter("premium");
  assert.equal(adapter.name, "local");
  for (const k of keys) {
    if (saved[k] !== undefined) process.env[k] = saved[k];
  }
});

test("TTS_ADAPTER_REGISTRY contains all four adapter names", () => {
  const names = Object.keys(TTS_ADAPTER_REGISTRY);
  assert.ok(names.includes("local"));
  assert.ok(names.includes("elevenlabs"));
  assert.ok(names.includes("openai_tts"));
  assert.ok(names.includes("google_tts"));
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npm test 2>&1 | grep "tts-adapter-registry"
```

Expected: import 에러

- [ ] **Step 3: 구현**

```typescript
// src/adapters/tts/tts-adapter-registry.ts
import type { ExecutionBackend } from "../../domain/contracts.js";
import type { TtsAdapter } from "./tts-adapter.js";
import { ElevenLabsAdapter } from "./elevenlabs-adapter.js";
import { GoogleTtsAdapter } from "./google-tts-adapter.js";
import { LocalTtsAdapter } from "./local-tts-adapter.js";
import { OpenAiTtsAdapter } from "./openai-tts-adapter.js";

// TTS_ADAPTER_REGISTRY includes "elevenlabs", "openai_tts", "google_tts" for
// internal use by the "premium" and "sora" cascades in resolveTtsAdapter.
// They are not direct ExecutionBackend values.
export const TTS_ADAPTER_REGISTRY: Record<string, TtsAdapter> = {
  local: new LocalTtsAdapter(),
  elevenlabs: new ElevenLabsAdapter(),
  openai_tts: new OpenAiTtsAdapter(),
  google_tts: new GoogleTtsAdapter(),
};

const local = TTS_ADAPTER_REGISTRY["local"]!;

export async function resolveTtsAdapter(
  backend: ExecutionBackend,
): Promise<TtsAdapter> {
  switch (backend) {
    case "local":
    case "gpu":
    case "cache":
      return local;

    case "sora": {
      const openai = TTS_ADAPTER_REGISTRY["openai_tts"]!;
      return (await openai.isAvailable()) ? openai : local;
    }

    case "premium": {
      const elevenlabs = TTS_ADAPTER_REGISTRY["elevenlabs"]!;
      if (await elevenlabs.isAvailable()) return elevenlabs;
      const openai = TTS_ADAPTER_REGISTRY["openai_tts"]!;
      if (await openai.isAvailable()) return openai;
      const google = TTS_ADAPTER_REGISTRY["google_tts"]!;
      if (await google.isAvailable()) return google;
      return local;
    }

    default:
      return local;
  }
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npm test 2>&1 | grep -E "(tts-adapter-registry|pass|fail)" | head -10
```

Expected: 6개 테스트 pass

- [ ] **Step 5: 커밋**

```bash
git add src/adapters/tts/tts-adapter-registry.ts tests/adapters/tts/tts-adapter-registry.test.ts
git commit -m "feat: add TTS adapter registry with fallback logic"
```

---

### Task 5: execute-tts 오케스트레이터 + 통합 테스트

**Files:**
- Create: `src/execute/execute-tts.ts`
- Create: `tests/adapters/tts/execute-tts.test.ts`

- [ ] **Step 1: 테스트 작성**

```typescript
// tests/adapters/tts/execute-tts.test.ts
import { test } from "node:test";
import * as assert from "node:assert/strict";
import type { TtsAdapter } from "../../../src/adapters/tts/tts-adapter.js";
import {
  executeTts,
  buildTtsRequestFromContext,
} from "../../../src/execute/execute-tts.js";
import { loadFixture } from "../../helpers/load-fixture.js";
import type { EngineRequest } from "../../../src/domain/contracts.js";
import { resolvePlanningContext } from "../../../src/cli/resolve-planning-context.js";

function makeMockTtsAdapter(name: string): TtsAdapter {
  return {
    name,
    async isAvailable() { return true; },
    async synthesize(_request, _opts) {
      return { status: "dry_run", metadata: { adapter: name } };
    },
  };
}

test("executeTts returns result for all nodes", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const context = resolvePlanningContext(request);
  const mockAdapter = makeMockTtsAdapter("mock");

  const result = await executeTts(context, {
    dry_run: true,
    resolveTtsAdapter: async () => mockAdapter,
  });

  assert.equal(result.dry_run, true);
  assert.ok(result.nodes.length > 0);
  assert.ok(result.summary.total > 0);
  assert.equal(result.summary.error, 0);
});

test("executeTts summary counts dry_run correctly", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const context = resolvePlanningContext(request);
  const mockAdapter = makeMockTtsAdapter("mock");

  const result = await executeTts(context, {
    dry_run: true,
    resolveTtsAdapter: async () => mockAdapter,
  });

  assert.equal(result.summary.dry_run, result.nodes.length);
  assert.equal(result.summary.success, 0);
});

test("buildTtsRequestFromContext returns valid TtsRequest", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const context = resolvePlanningContext(request);

  const ttsRequest = buildTtsRequestFromContext(context);

  assert.equal(typeof ttsRequest.text, "string");
  assert.ok(ttsRequest.text.length > 0);
  assert.equal(typeof ttsRequest.language, "string");
  assert.ok(["neutral", "energetic", "dramatic"].includes(ttsRequest.voice_style));
  assert.equal(typeof ttsRequest.duration_hint_sec, "number");
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npm test 2>&1 | grep "execute-tts"
```

Expected: import 에러

- [ ] **Step 3: 구현**

```typescript
// src/execute/execute-tts.ts
import type { PlanningContext } from "../cli/resolve-planning-context.js";
import type { TtsAdapter, TtsRequest, VoiceStyle } from "../adapters/tts/tts-adapter.js";
import type { ExecutionBackend } from "../domain/contracts.js";
import { resolveTtsAdapter as defaultResolveTtsAdapter } from "../adapters/tts/tts-adapter-registry.js";

export interface TtsNodeResult {
  node_id: string;
  adapter: string;
  status: "success" | "error" | "dry_run";
  output_path?: string;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface ExecuteTtsResult {
  schema_version: "0.1";
  executed_at: string;
  dry_run: boolean;
  nodes: TtsNodeResult[];
  summary: {
    total: number;
    success: number;
    dry_run: number;
    error: number;
  };
}

export interface ExecuteTtsOptions {
  dry_run: boolean;
  output_dir?: string;
  resolveTtsAdapter?: (backend: ExecutionBackend) => Promise<TtsAdapter>;
}

const VOICE_STYLE_MAP: Record<string, VoiceStyle> = {
  curiosity: "neutral",
  question: "neutral",
  surprise: "energetic",
  cliffhanger: "dramatic",
};

export function buildTtsRequestFromContext(context: PlanningContext): TtsRequest {
  const intent = context.effective_request.base.intent;
  const constraints = context.effective_request.base.constraints;
  const hookType = context.effective_request.base.style.hook_type;

  return {
    text: `${intent.topic}. ${intent.goal}. ${intent.emotion}.`,
    language: constraints.language,
    voice_style: VOICE_STYLE_MAP[hookType] ?? "neutral",
    duration_hint_sec: context.platform_output_spec.effective_duration_sec,
  };
}

export async function executeTts(
  context: PlanningContext,
  options: ExecuteTtsOptions,
): Promise<ExecuteTtsResult> {
  const resolve = options.resolveTtsAdapter ?? defaultResolveTtsAdapter;
  const ttsRequest = buildTtsRequestFromContext(context);
  const nodes: TtsNodeResult[] = [];

  for (const node of context.execution_plan.nodes) {
    const adapter = await resolve(node.backend);
    const result = await adapter.synthesize(ttsRequest, {
      dry_run: options.dry_run,
      ...(options.output_dir ? { output_dir: options.output_dir } : {}),
    });

    nodes.push({
      node_id: node.node_id,
      adapter: adapter.name,
      status: result.status,
      ...(result.output_path !== undefined ? { output_path: result.output_path } : {}),
      ...(result.error !== undefined ? { error: result.error } : {}),
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

- [ ] **Step 4: 빌드 확인**

```bash
npm run build
```

Expected: 에러 없음. 타입 에러 발생 시 `context.effective_request.base.constraints.language` 필드명 확인.

- [ ] **Step 5: 테스트 실행 — 통과 확인**

```bash
npm test 2>&1 | grep -E "(execute-tts|pass|fail)" | head -10
```

Expected: 3개 테스트 pass

- [ ] **Step 6: 커밋**

```bash
git add src/execute/execute-tts.ts tests/adapters/tts/execute-tts.test.ts
git commit -m "feat: implement execute-tts orchestrator"
```

---

### Task 6: engine tts CLI 명령어 + 테스트

**Files:**
- Create: `src/cli/tts-engine-command.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/config/profile-catalog.ts`
- Create: `tests/cli/tts-command.test.ts`

- [ ] **Step 1: 테스트 작성**

```typescript
// tests/cli/tts-command.test.ts
import { test } from "node:test";
import * as assert from "node:assert/strict";
import { runCli } from "../helpers/run-cli.js";

test("engine tts --dry-run returns success and JSON output", () => {
  const result = runCli([
    "tts",
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

test("engine tts --dry-run prints human-readable summary", () => {
  const result = runCli([
    "tts",
    "tests/fixtures/valid-low-cost-request.json",
    "--dry-run",
  ]);

  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /dry.run/i);
  assert.match(result.stdout, /nodes/i);
});

test("engine tts returns error for invalid request", () => {
  const result = runCli([
    "tts",
    "tests/fixtures/invalid-request.json",
    "--dry-run",
  ]);

  assert.notEqual(result.exitCode, 0);
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npm test 2>&1 | grep "tts-command"
```

Expected: 명령어 없음 또는 import 에러

- [ ] **Step 3: tts-engine-command.ts 작성**

```typescript
// src/cli/tts-engine-command.ts
import { writeFile } from "node:fs/promises";

import { resolveTtsAdapter } from "../adapters/tts/tts-adapter-registry.js";
import { resolvePlanningContext } from "./resolve-planning-context.js";
import { loadEngineRequest } from "./load-engine-request.js";
import {
  EXIT_CODE_INTERNAL_ERROR,
  EXIT_CODE_SUCCESS,
  EXIT_CODE_VALIDATION_FAILURE,
} from "./exit-codes.js";
import {
  executeTts,
  type ExecuteTtsResult,
} from "../execute/execute-tts.js";

function renderTtsOutput(result: ExecuteTtsResult, json: boolean): string {
  if (json) return `${JSON.stringify(result, null, 2)}\n`;

  const lines: string[] = [
    `TTS Result (dry_run: ${result.dry_run})`,
    `Executed at: ${result.executed_at}`,
    `Nodes: ${result.summary.total} total / ${result.summary.success} success / ${result.summary.dry_run} dry_run / ${result.summary.error} error`,
    "",
  ];

  for (const node of result.nodes) {
    lines.push(`  [${node.status}] ${node.node_id} → adapter: ${node.adapter}`);
    if (node.output_path) lines.push(`    output: ${node.output_path}`);
    if (node.error) lines.push(`    error: ${node.error}`);
  }

  return lines.join("\n") + "\n";
}

export async function ttsEngineCommand(
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
    const result = await executeTts(context, {
      dry_run: options.dry_run,
      resolveTtsAdapter,
    });

    const outputPath = requestPath.replace(/\.json$/, ".tts-result.json");
    try {
      await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    } catch {
      // writeFile failure does not affect exit code or output
    }

    return {
      exitCode: EXIT_CODE_SUCCESS,
      output: renderTtsOutput(result, options.json),
    };
  } catch (error) {
    return {
      exitCode: EXIT_CODE_INTERNAL_ERROR,
      output: `Fatal error: ${error instanceof Error ? error.message : "Unknown error"}\n`,
    };
  }
}
```

- [ ] **Step 4: index.ts에 tts 명령어 추가**

`src/cli/index.ts` 상단 import에 추가:
```typescript
import { ttsEngineCommand } from "./tts-engine-command.js";
```

최상위 `dry_run` 추출 확인 (이미 있음):
```typescript
const dry_run = flags.includes("--dry-run");
```

`executeCommand` 함수의 `execute` 블록 바로 아래에 추가:
```typescript
  if (commandName === "tts") {
    const [requestPath] = positionals;
    if (!requestPath) {
      return {
        exitCode: EXIT_CODE_INTERNAL_ERROR,
        output: "Usage: engine tts <request.json> [--dry-run] [--json]\n",
      };
    }
    return ttsEngineCommand(requestPath, { json: options.json, dry_run: options.dry_run });
  }
```

두 usage 문자열 모두 `tts` 추가:
```
"Usage: engine <run|prompt|create|wizard|execute|tts|config|doctor|analyze|render|publish> ..."
```

- [ ] **Step 5: profile-catalog.ts SUPPORTED_COMMANDS 업데이트**

`"tts"` 를 `"execute"` 다음에 추가:
```typescript
export const SUPPORTED_COMMANDS = [
  "run", "prompt", "create", "wizard", "execute", "tts",
  "config", "doctor", "analyze", "render", "publish",
];
```

- [ ] **Step 6: 빌드 확인**

```bash
npm run build
```

Expected: 에러 없음

- [ ] **Step 7: 테스트 실행 — 통과 확인**

```bash
npm test 2>&1 | tail -10
```

Expected: 전체 pass, fail 0

- [ ] **Step 8: 커밋**

```bash
git add src/cli/tts-engine-command.ts src/cli/index.ts src/config/profile-catalog.ts tests/cli/tts-command.test.ts
git commit -m "feat: add engine tts CLI command"
```

---

### Task 7: .env.example 업데이트 및 README 업데이트

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: .env.example에 TTS API 키 추가**

기존 `.env.example` 파일 끝에 추가:

```bash

# ─── TTS (음성 합성) ───────────────────────────────────────────

# ElevenLabs - https://elevenlabs.io
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# OpenAI TTS - https://platform.openai.com
OPENAI_API_KEY=your_openai_api_key_here

# Google Cloud TTS - https://cloud.google.com/text-to-speech
GOOGLE_TTS_API_KEY=your_google_tts_api_key_here
```

- [ ] **Step 2: README.md 업데이트**

**Change 1:** 명령어 표에 tts 추가 (execute 행 다음):
```markdown
| `engine tts <파일> [--dry-run]` | TTS 음성 합성 어댑터 호출 (API 키 필요) |
```

**Change 2:** "영상 생성 API 연동 방법" 섹션 아래에 TTS 섹션 추가:

```markdown
## TTS 음성 합성 API 연동 방법

`.env` 파일에 TTS API 키를 추가하세요 (`.env.example` 참고):

```bash
npm run engine -- tts my-request.json           # 실제 TTS API 호출
npm run engine -- tts my-request.json --dry-run # 테스트 (API 호출 없음)
```

API 키가 없으면 자동으로 `local` 어댑터(dry_run)로 동작합니다.
나레이션 대본은 요청 파일의 `topic`, `goal`, `emotion`을 조합해 자동 생성됩니다.

---
```

**Change 3:** "현재 구현되지 않은 기능"에서 TTS 항목 업데이트:
```
- 실제 TTS (음성 합성) 생성
```
→
```
- 실제 TTS (음성 합성) — 어댑터 프레임워크 구현 완료. ElevenLabs/OpenAI/Google TTS API 키를 `.env`에 추가하면 실제 생성 가능
```

**Change 4:** 테스트 수 업데이트 (91개 → 97개):
```
97개 테스트가 모두 통과하면 정상입니다.
```

- [ ] **Step 3: 전체 테스트 실행**

```bash
npm test 2>&1 | tail -10
```

Expected: 97개 pass

- [ ] **Step 4: 최종 커밋 및 푸시**

```bash
git add .env.example README.md
git commit -m "docs: add TTS API key setup guide and update README"
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ `TtsAdapter` 인터페이스 — Task 1
- ✅ `local` 어댑터 완전 구현 — Task 2
- ✅ ElevenLabs/OpenAI/Google TTS 뼈대 — Task 3
- ✅ 어댑터 레지스트리 + 폴백 — Task 4
- ✅ execution_plan 순회 + 어댑터 호출 — Task 5
- ✅ `engine tts` CLI + `--dry-run` — Task 6
- ✅ `.env.example` + README — Task 7
- ✅ 나레이션 대본 자동 생성 — Task 5 `buildTtsRequestFromContext`
- ✅ voice_style 자동 매핑 — Task 5

**Type consistency:**
- `TtsAdapter.synthesize` — Task 1 정의, Task 2/3/4/5에서 일관 사용 ✅
- `ExecutionBackend` — `contracts.ts`에서 import ✅
- `PlanningContext` — `effective_request.base.intent/constraints/style` 패턴 (1단계와 동일) ✅
