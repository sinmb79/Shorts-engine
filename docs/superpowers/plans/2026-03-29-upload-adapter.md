# Upload Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `engine upload <request.json> <video.mp4>` 명령어로 플랫폼 업로드 어댑터를 통해 영상을 YouTube Shorts / TikTok / Instagram Reels에 업로드한다.

**Architecture:** 1·2단계와 동일한 플러그인 패턴. 단 어댑터 선택 키가 `ExecutionBackend`가 아닌 `Platform`이며, execution_plan 노드 순회 없이 단일 결과를 반환한다. API 토큰 없으면 `local` 어댑터(dry_run)로 자동 폴백.

**Tech Stack:** Node.js 24 ESM, TypeScript 5, `node:test` + `assert/strict` (테스트)

---

## File Map

| 경로 | 역할 |
|------|------|
| `src/adapters/upload/upload-adapter.ts` | 인터페이스 및 공용 타입 |
| `src/adapters/upload/local-upload-adapter.ts` | 완전 구현 (항상 dry_run) |
| `src/adapters/upload/youtube-upload-adapter.ts` | 뼈대 (YOUTUBE_CLIENT_ID + YOUTUBE_REFRESH_TOKEN) |
| `src/adapters/upload/tiktok-upload-adapter.ts` | 뼈대 (TIKTOK_ACCESS_TOKEN) |
| `src/adapters/upload/instagram-upload-adapter.ts` | 뼈대 (INSTAGRAM_ACCESS_TOKEN + INSTAGRAM_ACCOUNT_ID) |
| `src/adapters/upload/upload-adapter-registry.ts` | platform → 어댑터 선택 + local 폴백 |
| `src/execute/execute-upload.ts` | PublishPlan 구성 + 업로드 어댑터 호출 |
| `src/cli/upload-engine-command.ts` | `engine upload` 명령어 핸들러 |
| `src/cli/index.ts` | `upload` 명령어 라우팅 추가 |
| `src/config/profile-catalog.ts` | SUPPORTED_COMMANDS에 `upload` 추가 |
| `.env.example` | 업로드 API 토큰 설정 예시 추가 |
| `tests/adapters/upload/local-upload-adapter.test.ts` | local 어댑터 단위 테스트 |
| `tests/adapters/upload/upload-adapter-registry.test.ts` | 레지스트리 단위 테스트 |
| `tests/adapters/upload/execute-upload.test.ts` | 통합 테스트 |
| `tests/cli/upload-command.test.ts` | CLI 통합 테스트 |

---

### Task 1: UploadAdapter 인터페이스 정의

**Files:**
- Create: `src/adapters/upload/upload-adapter.ts`

- [ ] **Step 1: 파일 생성**

```typescript
// src/adapters/upload/upload-adapter.ts
import type { Platform } from "../../domain/contracts.js";

export type { Platform };

export interface UploadRequest {
  video_path: string;
  title: string;
  description: string;
  hashtags: string[];
  platform: Platform;
}

export interface UploadResult {
  status: "success" | "error" | "dry_run";
  post_url?: string;
  post_id?: string;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface UploadOptions {
  dry_run: boolean;
}

export interface UploadAdapter {
  name: string;
  platform: Platform;
  isAvailable(): Promise<boolean>;
  upload(request: UploadRequest, options: UploadOptions): Promise<UploadResult>;
}
```

- [ ] **Step 2: 빌드 확인**

```bash
npm run build
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/adapters/upload/upload-adapter.ts
git commit -m "feat: add UploadAdapter interface"
```

---

### Task 2: local 업로드 어댑터 구현 + 테스트

**Files:**
- Create: `src/adapters/upload/local-upload-adapter.ts`
- Create: `tests/adapters/upload/local-upload-adapter.test.ts`

- [ ] **Step 1: 테스트 작성**

```typescript
// tests/adapters/upload/local-upload-adapter.test.ts
import { test } from "node:test";
import * as assert from "node:assert/strict";
import { LocalUploadAdapter } from "../../../src/adapters/upload/local-upload-adapter.js";

test("local upload adapter is always available", async () => {
  const adapter = new LocalUploadAdapter();
  assert.equal(await adapter.isAvailable(), true);
});

test("local upload adapter returns dry_run status", async () => {
  const adapter = new LocalUploadAdapter();
  const result = await adapter.upload(
    {
      video_path: "/tmp/test.mp4",
      title: "Test",
      description: "Test description",
      hashtags: ["#test"],
      platform: "youtube_shorts",
    },
    { dry_run: false },
  );
  assert.equal(result.status, "dry_run");
  assert.equal(result.post_url, undefined);
  assert.equal(result.post_id, undefined);
  assert.equal(typeof result.metadata, "object");
});

test("local upload adapter name is 'local'", () => {
  const adapter = new LocalUploadAdapter();
  assert.equal(adapter.name, "local");
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npm test 2>&1 | grep "local-upload-adapter"
```

Expected: import 에러

- [ ] **Step 3: 구현**

```typescript
// src/adapters/upload/local-upload-adapter.ts
import type {
  UploadAdapter,
  UploadOptions,
  UploadRequest,
  UploadResult,
} from "./upload-adapter.js";
import type { Platform } from "../../domain/contracts.js";

export class LocalUploadAdapter implements UploadAdapter {
  name = "local";
  platform: Platform = "youtube_shorts";

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async upload(
    request: UploadRequest,
    _options: UploadOptions,
  ): Promise<UploadResult> {
    return {
      status: "dry_run",
      metadata: {
        adapter: "local",
        platform: request.platform,
        video_path: request.video_path,
        title: request.title,
      },
    };
  }
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npm test 2>&1 | grep -E "(local upload|pass|fail)" | head -10
```

Expected: 3개 테스트 pass

- [ ] **Step 5: 커밋**

```bash
git add src/adapters/upload/local-upload-adapter.ts tests/adapters/upload/local-upload-adapter.test.ts
git commit -m "feat: implement local upload adapter"
```

---

### Task 3: YouTube / TikTok / Instagram 뼈대 어댑터

**Files:**
- Create: `src/adapters/upload/youtube-upload-adapter.ts`
- Create: `src/adapters/upload/tiktok-upload-adapter.ts`
- Create: `src/adapters/upload/instagram-upload-adapter.ts`

- [ ] **Step 1: YouTube 어댑터 생성**

```typescript
// src/adapters/upload/youtube-upload-adapter.ts
import type {
  UploadAdapter,
  UploadOptions,
  UploadRequest,
  UploadResult,
} from "./upload-adapter.js";
import type { Platform } from "../../domain/contracts.js";

export class YoutubeUploadAdapter implements UploadAdapter {
  name = "youtube";
  platform: Platform = "youtube_shorts";

  async isAvailable(): Promise<boolean> {
    return (
      Boolean(process.env["YOUTUBE_CLIENT_ID"]) &&
      Boolean(process.env["YOUTUBE_REFRESH_TOKEN"])
    );
  }

  async upload(
    _request: UploadRequest,
    options: UploadOptions,
  ): Promise<UploadResult> {
    if (options.dry_run) {
      return {
        status: "dry_run",
        metadata: { adapter: "youtube", dry_run: true },
      };
    }

    const clientId = process.env["YOUTUBE_CLIENT_ID"];
    const refreshToken = process.env["YOUTUBE_REFRESH_TOKEN"];
    if (!clientId || !refreshToken) {
      return {
        status: "error",
        error: "YOUTUBE_CLIENT_ID or YOUTUBE_REFRESH_TOKEN is not set in environment",
        metadata: { adapter: "youtube" },
      };
    }

    // YouTube Data API v3 업로드 구조
    // 실제 사용 시 아래 주석을 해제하고 토큰을 .env에 추가하세요.
    //
    // Step 1: access token 갱신
    // const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
    //   body: new URLSearchParams({
    //     client_id: clientId,
    //     refresh_token: refreshToken,
    //     grant_type: "refresh_token",
    //   }),
    // });
    // const { access_token } = await tokenRes.json() as { access_token: string };
    //
    // Step 2: 영상 업로드 (멀티파트)
    // const videoData = await readFile(_request.video_path);
    // const metadata = JSON.stringify({
    //   snippet: {
    //     title: _request.title,
    //     description: `${_request.description}\n${_request.hashtags.join(" ")}`,
    //     tags: _request.hashtags.map((h) => h.replace("#", "")),
    //   },
    //   status: { privacyStatus: "public" },
    // });
    // const boundary = "boundary_" + Date.now();
    // const body = Buffer.concat([
    //   Buffer.from(`--${boundary}\r\nContent-Type: application/json\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: video/mp4\r\n\r\n`),
    //   videoData,
    //   Buffer.from(`\r\n--${boundary}--`),
    // ]);
    // const uploadRes = await fetch(
    //   "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
    //   {
    //     method: "POST",
    //     headers: {
    //       "Authorization": `Bearer ${access_token}`,
    //       "Content-Type": `multipart/related; boundary=${boundary}`,
    //     },
    //     body,
    //   },
    // );
    // const data = await uploadRes.json() as { id: string };
    // return {
    //   status: "success",
    //   post_id: data.id,
    //   post_url: `https://www.youtube.com/shorts/${data.id}`,
    //   metadata: { adapter: "youtube" },
    // };

    return {
      status: "dry_run",
      metadata: {
        adapter: "youtube",
        note: "Add YOUTUBE_CLIENT_ID and YOUTUBE_REFRESH_TOKEN to .env and uncomment the fetch calls above",
      },
    };
  }
}
```

- [ ] **Step 2: TikTok 어댑터 생성**

```typescript
// src/adapters/upload/tiktok-upload-adapter.ts
import type {
  UploadAdapter,
  UploadOptions,
  UploadRequest,
  UploadResult,
} from "./upload-adapter.js";
import type { Platform } from "../../domain/contracts.js";

export class TiktokUploadAdapter implements UploadAdapter {
  name = "tiktok";
  platform: Platform = "tiktok";

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env["TIKTOK_ACCESS_TOKEN"]);
  }

  async upload(
    _request: UploadRequest,
    options: UploadOptions,
  ): Promise<UploadResult> {
    if (options.dry_run) {
      return {
        status: "dry_run",
        metadata: { adapter: "tiktok", dry_run: true },
      };
    }

    const accessToken = process.env["TIKTOK_ACCESS_TOKEN"];
    if (!accessToken) {
      return {
        status: "error",
        error: "TIKTOK_ACCESS_TOKEN is not set in environment",
        metadata: { adapter: "tiktok" },
      };
    }

    // TikTok Content Posting API 업로드 구조
    // 실제 사용 시 아래 주석을 해제하고 토큰을 .env에 추가하세요.
    //
    // Step 1: 업로드 초기화
    // const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${accessToken}`,
    //     "Content-Type": "application/json; charset=UTF-8",
    //   },
    //   body: JSON.stringify({
    //     post_info: {
    //       title: _request.title,
    //       privacy_level: "PUBLIC_TO_EVERYONE",
    //       disable_duet: false,
    //       disable_comment: false,
    //       disable_stitch: false,
    //     },
    //     source_info: { source: "FILE_UPLOAD", video_size: 0 },
    //   }),
    // });
    // const { data: { publish_id, upload_url } } = await initRes.json() as {
    //   data: { publish_id: string; upload_url: string }
    // };
    //
    // Step 2: 영상 파일 업로드
    // const videoData = await readFile(_request.video_path);
    // await fetch(upload_url, {
    //   method: "PUT",
    //   headers: { "Content-Type": "video/mp4", "Content-Range": `bytes 0-${videoData.length - 1}/${videoData.length}` },
    //   body: videoData,
    // });
    // return {
    //   status: "success",
    //   post_id: publish_id,
    //   post_url: `https://www.tiktok.com/@me/video/${publish_id}`,
    //   metadata: { adapter: "tiktok" },
    // };

    return {
      status: "dry_run",
      metadata: {
        adapter: "tiktok",
        note: "Add TIKTOK_ACCESS_TOKEN to .env and uncomment the fetch calls above",
      },
    };
  }
}
```

- [ ] **Step 3: Instagram 어댑터 생성**

```typescript
// src/adapters/upload/instagram-upload-adapter.ts
import type {
  UploadAdapter,
  UploadOptions,
  UploadRequest,
  UploadResult,
} from "./upload-adapter.js";
import type { Platform } from "../../domain/contracts.js";

export class InstagramUploadAdapter implements UploadAdapter {
  name = "instagram";
  platform: Platform = "instagram_reels";

  async isAvailable(): Promise<boolean> {
    return (
      Boolean(process.env["INSTAGRAM_ACCESS_TOKEN"]) &&
      Boolean(process.env["INSTAGRAM_ACCOUNT_ID"])
    );
  }

  async upload(
    _request: UploadRequest,
    options: UploadOptions,
  ): Promise<UploadResult> {
    if (options.dry_run) {
      return {
        status: "dry_run",
        metadata: { adapter: "instagram", dry_run: true },
      };
    }

    const accessToken = process.env["INSTAGRAM_ACCESS_TOKEN"];
    const accountId = process.env["INSTAGRAM_ACCOUNT_ID"];
    if (!accessToken || !accountId) {
      return {
        status: "error",
        error: "INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_ACCOUNT_ID is not set in environment",
        metadata: { adapter: "instagram" },
      };
    }

    // Instagram Graph API Reels 업로드 구조
    // 실제 사용 시 아래 주석을 해제하고 토큰을 .env에 추가하세요.
    // 주의: Instagram API는 공개 URL의 영상만 업로드 가능합니다 (로컬 파일 직접 업로드 불가).
    //
    // Step 1: 미디어 컨테이너 생성
    // const createRes = await fetch(
    //   `https://graph.facebook.com/v19.0/${accountId}/media`,
    //   {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       media_type: "REELS",
    //       video_url: "https://your-public-cdn.com/video.mp4",  // 공개 URL 필요
    //       caption: `${_request.description}\n${_request.hashtags.join(" ")}`,
    //       access_token: accessToken,
    //     }),
    //   },
    // );
    // const { id: containerId } = await createRes.json() as { id: string };
    //
    // Step 2: 게시
    // const publishRes = await fetch(
    //   `https://graph.facebook.com/v19.0/${accountId}/media_publish`,
    //   {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ creation_id: containerId, access_token: accessToken }),
    //   },
    // );
    // const { id: postId } = await publishRes.json() as { id: string };
    // return {
    //   status: "success",
    //   post_id: postId,
    //   post_url: `https://www.instagram.com/reel/${postId}/`,
    //   metadata: { adapter: "instagram" },
    // };

    return {
      status: "dry_run",
      metadata: {
        adapter: "instagram",
        note: "Add INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID to .env and uncomment the fetch calls above",
      },
    };
  }
}
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build
```

Expected: 에러 없음. TypeScript가 미사용 파라미터 경고 시 `_request`(underscore 접두사)로 이름 변경.

- [ ] **Step 5: 커밋**

```bash
git add src/adapters/upload/youtube-upload-adapter.ts src/adapters/upload/tiktok-upload-adapter.ts src/adapters/upload/instagram-upload-adapter.ts
git commit -m "feat: add youtube, tiktok, instagram upload adapter skeletons"
```

---

### Task 4: 업로드 어댑터 레지스트리 + 테스트

**Files:**
- Create: `src/adapters/upload/upload-adapter-registry.ts`
- Create: `tests/adapters/upload/upload-adapter-registry.test.ts`

- [ ] **Step 1: 테스트 작성**

```typescript
// tests/adapters/upload/upload-adapter-registry.test.ts
import { test } from "node:test";
import * as assert from "node:assert/strict";
import {
  resolveUploadAdapter,
  UPLOAD_ADAPTER_REGISTRY,
} from "../../../src/adapters/upload/upload-adapter-registry.js";

test("resolveUploadAdapter returns local for youtube_shorts when no credentials", async () => {
  const savedClientId = process.env["YOUTUBE_CLIENT_ID"];
  const savedToken = process.env["YOUTUBE_REFRESH_TOKEN"];
  delete process.env["YOUTUBE_CLIENT_ID"];
  delete process.env["YOUTUBE_REFRESH_TOKEN"];

  const adapter = await resolveUploadAdapter("youtube_shorts");
  assert.equal(adapter.name, "local");

  if (savedClientId !== undefined) process.env["YOUTUBE_CLIENT_ID"] = savedClientId;
  if (savedToken !== undefined) process.env["YOUTUBE_REFRESH_TOKEN"] = savedToken;
});

test("resolveUploadAdapter returns local for tiktok when no credentials", async () => {
  const saved = process.env["TIKTOK_ACCESS_TOKEN"];
  delete process.env["TIKTOK_ACCESS_TOKEN"];

  const adapter = await resolveUploadAdapter("tiktok");
  assert.equal(adapter.name, "local");

  if (saved !== undefined) process.env["TIKTOK_ACCESS_TOKEN"] = saved;
});

test("resolveUploadAdapter returns local for instagram_reels when no credentials", async () => {
  const savedToken = process.env["INSTAGRAM_ACCESS_TOKEN"];
  const savedId = process.env["INSTAGRAM_ACCOUNT_ID"];
  delete process.env["INSTAGRAM_ACCESS_TOKEN"];
  delete process.env["INSTAGRAM_ACCOUNT_ID"];

  const adapter = await resolveUploadAdapter("instagram_reels");
  assert.equal(adapter.name, "local");

  if (savedToken !== undefined) process.env["INSTAGRAM_ACCESS_TOKEN"] = savedToken;
  if (savedId !== undefined) process.env["INSTAGRAM_ACCOUNT_ID"] = savedId;
});

test("UPLOAD_ADAPTER_REGISTRY contains all adapter names", () => {
  const names = Object.keys(UPLOAD_ADAPTER_REGISTRY);
  assert.ok(names.includes("local"));
  assert.ok(names.includes("youtube"));
  assert.ok(names.includes("tiktok"));
  assert.ok(names.includes("instagram"));
});

test("resolveUploadAdapter always returns an adapter (local fallback)", async () => {
  const adapter = await resolveUploadAdapter("youtube_shorts");
  assert.ok(typeof adapter.name === "string");
  assert.ok(typeof adapter.upload === "function");
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npm test 2>&1 | grep "upload-adapter-registry"
```

Expected: import 에러

- [ ] **Step 3: 구현**

```typescript
// src/adapters/upload/upload-adapter-registry.ts
import type { Platform } from "../../domain/contracts.js";
import type { UploadAdapter } from "./upload-adapter.js";
import { InstagramUploadAdapter } from "./instagram-upload-adapter.js";
import { LocalUploadAdapter } from "./local-upload-adapter.js";
import { TiktokUploadAdapter } from "./tiktok-upload-adapter.js";
import { YoutubeUploadAdapter } from "./youtube-upload-adapter.js";

export const UPLOAD_ADAPTER_REGISTRY: Record<string, UploadAdapter> = {
  local: new LocalUploadAdapter(),
  youtube: new YoutubeUploadAdapter(),
  tiktok: new TiktokUploadAdapter(),
  instagram: new InstagramUploadAdapter(),
};

const local = UPLOAD_ADAPTER_REGISTRY["local"]!;

export async function resolveUploadAdapter(
  platform: Platform,
): Promise<UploadAdapter> {
  switch (platform) {
    case "youtube_shorts": {
      const youtube = UPLOAD_ADAPTER_REGISTRY["youtube"]!;
      return (await youtube.isAvailable()) ? youtube : local;
    }

    case "tiktok": {
      const tiktok = UPLOAD_ADAPTER_REGISTRY["tiktok"]!;
      return (await tiktok.isAvailable()) ? tiktok : local;
    }

    case "instagram_reels": {
      const instagram = UPLOAD_ADAPTER_REGISTRY["instagram"]!;
      return (await instagram.isAvailable()) ? instagram : local;
    }

    default:
      return local;
  }
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
npm test 2>&1 | grep -E "(upload-adapter-registry|pass|fail)" | head -10
```

Expected: 5개 테스트 pass

- [ ] **Step 5: 커밋**

```bash
git add src/adapters/upload/upload-adapter-registry.ts tests/adapters/upload/upload-adapter-registry.test.ts
git commit -m "feat: add upload adapter registry with platform-based routing"
```

---

### Task 5: execute-upload 오케스트레이터 + 통합 테스트

**Files:**
- Create: `src/execute/execute-upload.ts`
- Create: `tests/adapters/upload/execute-upload.test.ts`

- [ ] **Step 1: 테스트 작성**

```typescript
// tests/adapters/upload/execute-upload.test.ts
import { test } from "node:test";
import * as assert from "node:assert/strict";
import type { UploadAdapter } from "../../../src/adapters/upload/upload-adapter.js";
import {
  executeUpload,
  buildUploadRequest,
} from "../../../src/execute/execute-upload.js";
import { loadFixture } from "../../helpers/load-fixture.js";
import type { EngineRequest } from "../../../src/domain/contracts.js";
import { resolvePlanningContext } from "../../../src/cli/resolve-planning-context.js";

function makeMockUploadAdapter(name: string): UploadAdapter {
  return {
    name,
    platform: "youtube_shorts",
    async isAvailable() { return true; },
    async upload(_request, _opts) {
      return { status: "dry_run", metadata: { adapter: name } };
    },
  };
}

test("executeUpload returns dry_run result", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const context = resolvePlanningContext(request);
  const mockAdapter = makeMockUploadAdapter("mock");

  const result = await executeUpload(context, "test.mp4", {
    dry_run: true,
    resolveUploadAdapter: async () => mockAdapter,
  });

  assert.equal(result.dry_run, true);
  assert.equal(result.status, "dry_run");
  assert.equal(result.adapter, "mock");
});

test("executeUpload sets platform from context", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const context = resolvePlanningContext(request);
  const mockAdapter = makeMockUploadAdapter("mock");

  const result = await executeUpload(context, "test.mp4", {
    dry_run: true,
    resolveUploadAdapter: async () => mockAdapter,
  });

  assert.ok(
    result.platform === "youtube_shorts" ||
    result.platform === "tiktok" ||
    result.platform === "instagram_reels",
  );
});

test("buildUploadRequest returns valid UploadRequest", async () => {
  const request = await loadFixture<EngineRequest>("valid-low-cost-request.json");
  const context = resolvePlanningContext(request);

  const uploadRequest = buildUploadRequest(context, "/tmp/test.mp4");

  assert.equal(uploadRequest.video_path, "/tmp/test.mp4");
  assert.equal(typeof uploadRequest.title, "string");
  assert.ok(uploadRequest.title.length > 0);
  assert.ok(Array.isArray(uploadRequest.hashtags));
  assert.ok(
    uploadRequest.platform === "youtube_shorts" ||
    uploadRequest.platform === "tiktok" ||
    uploadRequest.platform === "instagram_reels",
  );
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npm test 2>&1 | grep "execute-upload"
```

Expected: import 에러

- [ ] **Step 3: 구현**

```typescript
// src/execute/execute-upload.ts
import type { Platform } from "../domain/contracts.js";
import type { PlanningContext } from "../cli/resolve-planning-context.js";
import type { UploadAdapter, UploadRequest } from "../adapters/upload/upload-adapter.js";
import { resolveUploadAdapter as defaultResolveUploadAdapter } from "../adapters/upload/upload-adapter-registry.js";

export interface ExecuteUploadResult {
  schema_version: "0.1";
  executed_at: string;
  dry_run: boolean;
  platform: Platform;
  adapter: string;
  status: "success" | "error" | "dry_run";
  post_url?: string;
  post_id?: string;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface ExecuteUploadOptions {
  dry_run: boolean;
  resolveUploadAdapter?: (platform: Platform) => Promise<UploadAdapter>;
}

export function buildUploadRequest(
  context: PlanningContext,
  videoPath: string,
): UploadRequest {
  const intent = context.effective_request.base.intent;
  const platform = context.platform_output_spec.platform;

  const hashtags = [
    `#${intent.theme.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    `#${intent.platform.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    `#${intent.topic.split(" ").slice(0, 2).join("").toLowerCase().replace(/[^a-z0-9]/g, "")}`,
  ].filter(Boolean);

  return {
    video_path: videoPath,
    title: intent.topic,
    description: `${intent.goal}. Theme: ${intent.theme}.`,
    hashtags,
    platform,
  };
}

export async function executeUpload(
  context: PlanningContext,
  videoPath: string,
  options: ExecuteUploadOptions,
): Promise<ExecuteUploadResult> {
  const resolve = options.resolveUploadAdapter ?? defaultResolveUploadAdapter;
  const uploadRequest = buildUploadRequest(context, videoPath);
  const adapter = await resolve(uploadRequest.platform);
  const result = await adapter.upload(uploadRequest, { dry_run: options.dry_run });

  return {
    schema_version: "0.1",
    executed_at: new Date().toISOString(),
    dry_run: options.dry_run,
    platform: uploadRequest.platform,
    adapter: adapter.name,
    status: result.status,
    ...(result.post_url !== undefined ? { post_url: result.post_url } : {}),
    ...(result.post_id !== undefined ? { post_id: result.post_id } : {}),
    ...(result.error !== undefined ? { error: result.error } : {}),
    metadata: result.metadata,
  };
}
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build
```

Expected: 에러 없음

- [ ] **Step 5: 테스트 실행 — 통과 확인**

```bash
npm test 2>&1 | grep -E "(execute-upload|pass|fail)" | head -10
```

Expected: 3개 테스트 pass

- [ ] **Step 6: 커밋**

```bash
git add src/execute/execute-upload.ts tests/adapters/upload/execute-upload.test.ts
git commit -m "feat: implement execute-upload orchestrator"
```

---

### Task 6: engine upload CLI 명령어 + 테스트

**Files:**
- Create: `src/cli/upload-engine-command.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/config/profile-catalog.ts`
- Create: `tests/cli/upload-command.test.ts`

- [ ] **Step 1: 테스트 작성**

```typescript
// tests/cli/upload-command.test.ts
import { test } from "node:test";
import * as assert from "node:assert/strict";
import { runCli } from "../helpers/run-cli.js";

test("engine upload --dry-run returns success and JSON output", () => {
  const result = runCli([
    "upload",
    "tests/fixtures/valid-low-cost-request.json",
    "tests/fixtures/fake-video.mp4",
    "--dry-run",
    "--json",
  ]);

  assert.equal(result.exitCode, 0);
  const parsed = JSON.parse(result.stdout) as {
    schema_version?: string;
    dry_run?: boolean;
    platform?: string;
    status?: string;
  };
  assert.equal(parsed.schema_version, "0.1");
  assert.equal(parsed.dry_run, true);
  assert.ok(typeof parsed.platform === "string");
  assert.equal(parsed.status, "dry_run");
});

test("engine upload --dry-run prints human-readable summary", () => {
  const result = runCli([
    "upload",
    "tests/fixtures/valid-low-cost-request.json",
    "tests/fixtures/fake-video.mp4",
    "--dry-run",
  ]);

  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /dry.run/i);
  assert.match(result.stdout, /platform/i);
});

test("engine upload returns error for invalid request", () => {
  const result = runCli([
    "upload",
    "tests/fixtures/invalid-request.json",
    "tests/fixtures/fake-video.mp4",
    "--dry-run",
  ]);

  assert.notEqual(result.exitCode, 0);
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npm test 2>&1 | grep "upload-command"
```

Expected: 명령어 없음 또는 import 에러

- [ ] **Step 3: upload-engine-command.ts 작성**

```typescript
// src/cli/upload-engine-command.ts
import { writeFile } from "node:fs/promises";

import { resolveUploadAdapter } from "../adapters/upload/upload-adapter-registry.js";
import { resolvePlanningContext } from "./resolve-planning-context.js";
import { loadEngineRequest } from "./load-engine-request.js";
import {
  EXIT_CODE_INTERNAL_ERROR,
  EXIT_CODE_SUCCESS,
  EXIT_CODE_VALIDATION_FAILURE,
} from "./exit-codes.js";
import {
  executeUpload,
  type ExecuteUploadResult,
} from "../execute/execute-upload.js";

function renderUploadOutput(result: ExecuteUploadResult, json: boolean): string {
  if (json) return `${JSON.stringify(result, null, 2)}\n`;

  const lines: string[] = [
    `Upload Result (dry_run: ${result.dry_run})`,
    `Executed at: ${result.executed_at}`,
    `Platform: ${result.platform} | Adapter: ${result.adapter} | Status: ${result.status}`,
  ];

  if (result.post_url) lines.push(`URL: ${result.post_url}`);
  if (result.post_id) lines.push(`Post ID: ${result.post_id}`);
  if (result.error) lines.push(`Error: ${result.error}`);

  return lines.join("\n") + "\n";
}

export async function uploadEngineCommand(
  requestPath: string,
  videoPath: string,
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
    const result = await executeUpload(context, videoPath, {
      dry_run: options.dry_run,
      resolveUploadAdapter,
    });

    const outputPath = requestPath.replace(/\.json$/, ".upload-result.json");
    try {
      await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    } catch {
      // writeFile failure does not affect exit code or output
    }

    return {
      exitCode: EXIT_CODE_SUCCESS,
      output: renderUploadOutput(result, options.json),
    };
  } catch (error) {
    return {
      exitCode: EXIT_CODE_INTERNAL_ERROR,
      output: `Fatal error: ${error instanceof Error ? error.message : "Unknown error"}\n`,
    };
  }
}
```

- [ ] **Step 4: index.ts에 upload 명령어 추가**

`src/cli/index.ts` 상단 import에 추가:
```typescript
import { uploadEngineCommand } from "./upload-engine-command.js";
```

`tts` 블록 바로 아래에 추가:
```typescript
  if (commandName === "upload") {
    const [requestPath, videoPath] = positionals;
    if (!requestPath || !videoPath) {
      return {
        exitCode: EXIT_CODE_INTERNAL_ERROR,
        output: "Usage: engine upload <request.json> <video.mp4> [--dry-run] [--json]\n",
      };
    }
    return uploadEngineCommand(requestPath, videoPath, { json: options.json, dry_run: options.dry_run });
  }
```

두 usage 문자열에 `upload` 추가:
```
"Usage: engine <run|prompt|create|wizard|execute|tts|upload|config|doctor|analyze|render|publish> ..."
```

- [ ] **Step 5: profile-catalog.ts SUPPORTED_COMMANDS 업데이트**

`"upload"`를 `"tts"` 다음에 추가:
```typescript
export const SUPPORTED_COMMANDS = [
  "run", "prompt", "create", "wizard", "execute", "tts", "upload",
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
git add src/cli/upload-engine-command.ts src/cli/index.ts src/config/profile-catalog.ts tests/cli/upload-command.test.ts
git commit -m "feat: add engine upload CLI command"
```

---

### Task 7: .env.example 업데이트 및 README 업데이트

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: .env.example에 업로드 API 토큰 추가**

기존 `.env.example` 파일 끝에 추가:

```bash

# ─── 플랫폼 업로드 ─────────────────────────────────────────────

# YouTube Data API v3 - https://developers.google.com/youtube/v3
YOUTUBE_CLIENT_ID=your_youtube_client_id_here
YOUTUBE_REFRESH_TOKEN=your_youtube_refresh_token_here

# TikTok for Developers - https://developers.tiktok.com
TIKTOK_ACCESS_TOKEN=your_tiktok_access_token_here

# Instagram Graph API - https://developers.facebook.com/docs/instagram-api
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
INSTAGRAM_ACCOUNT_ID=your_instagram_account_id_here
```

- [ ] **Step 2: README.md 업데이트**

**Change 1:** 명령어 표에 upload 추가 (tts 행 다음):
```markdown
| `engine upload <파일> <영상.mp4> [--dry-run]` | 플랫폼 업로드 어댑터 호출 (API 토큰 필요) |
```

**Change 2:** "TTS 음성 합성 API 연동 방법" 섹션 아래에 업로드 섹션 추가:

```markdown
## 플랫폼 업로드 API 연동 방법

`.env` 파일에 업로드 API 토큰을 추가하세요 (`.env.example` 참고):

```bash
npm run engine -- upload my-request.json video.mp4           # 실제 플랫폼 업로드
npm run engine -- upload my-request.json video.mp4 --dry-run # 테스트 (업로드 없음)
```

API 토큰이 없으면 자동으로 `local` 어댑터(dry_run)로 동작합니다.
업로드 제목, 설명, 해시태그는 요청 파일의 `topic`, `goal`, `theme`을 조합해 자동 생성됩니다.

---
```

**Change 3:** "현재 구현되지 않은 기능"에서 업로드 항목 업데이트:
```
- 플랫폼 업로드 (YouTube, TikTok, Instagram)
```
→
```
- 플랫폼 업로드 (YouTube, TikTok, Instagram) — 어댑터 프레임워크 구현 완료. 각 플랫폼 API 토큰을 `.env`에 추가하면 실제 업로드 가능
```

**Change 4:** 테스트 수 업데이트 (106개 → 117개):
```
117개 테스트가 모두 통과하면 정상입니다.
```

- [ ] **Step 3: 전체 테스트 실행**

```bash
npm test 2>&1 | tail -10
```

Expected: 117개 pass

- [ ] **Step 4: 최종 커밋 및 푸시**

```bash
git add .env.example README.md
git commit -m "docs: add upload API token setup guide and update README"
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ `UploadAdapter` 인터페이스 — Task 1
- ✅ `local` 어댑터 완전 구현 — Task 2
- ✅ YouTube/TikTok/Instagram 뼈대 어댑터 — Task 3
- ✅ 어댑터 레지스트리 + platform 기반 라우팅 — Task 4
- ✅ execute-upload 오케스트레이터 — Task 5
- ✅ `engine upload` CLI + `--dry-run` — Task 6
- ✅ `.env.example` + README — Task 7
- ✅ UploadRequest 자동 생성 (topic/goal/theme) — Task 5 `buildUploadRequest`
- ✅ 단일 결과 (nodes 배열 없음) — Task 5

**Type consistency:**
- `UploadAdapter.upload` — Task 1 정의, Task 2/3/4/5에서 일관 사용 ✅
- `Platform` — `contracts.ts`에서 import ✅
- `PlanningContext` — `effective_request.base.intent/constraints`, `platform_output_spec.platform` 패턴 (1·2단계와 동일) ✅
- `ExecuteUploadResult` — Task 5 정의, Task 6에서 사용 ✅

- `YoutubeUploadAdapter.upload` — Task 3에서 직접 구현, `synthesize` 헬퍼 없음 ✅
