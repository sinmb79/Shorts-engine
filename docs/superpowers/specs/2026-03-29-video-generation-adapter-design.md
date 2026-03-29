# Video Generation Adapter — Design Spec

**Date:** 2026-03-29
**Scope:** 1단계 — 영상 생성 실행 레이어
**Status:** Approved

---

## Overview

현재 `engine run`은 `execution_plan`(계획)까지만 생성한다. 이 스펙은 계획을 실제로 실행하는 **영상 생성 어댑터 레이어**를 추가한다. 사용자는 `.env`에 API 키만 넣으면 Sora, Runway, Kling 등 외부 서비스를 통해 실제 영상을 생성할 수 있다. API 키가 없으면 `local` 어댑터로 자동 폴백된다.

---

## New CLI Command

```bash
engine execute <요청파일.json>            # 실제 API 호출
engine execute <요청파일.json> --dry-run  # API 호출 없이 설정 검증만
```

기존 명령어는 변경 없음.

---

## File Structure

```
src/
  adapters/
    video/
      video-generation-adapter.ts   TypeScript 인터페이스 및 타입 정의
      adapter-registry.ts           backend 이름 → 어댑터 인스턴스 매핑
      local-adapter.ts              완전 구현 (API 키 불필요, dry_run 반환)
      sora-adapter.ts               뼈대 구현 (SORA_API_KEY 필요)
      runway-adapter.ts             뼈대 구현 (RUNWAY_API_KEY 필요)
      kling-adapter.ts              뼈대 구현 (KLING_API_KEY 필요)
  execute/
    execute-video-generation.ts     execution_plan 순회 및 어댑터 호출
  cli/
    execute-engine-command.ts       engine execute 명령어 핸들러
tests/
  adapters/
    video/
      local-adapter.test.ts
      adapter-registry.test.ts
      execute-video-generation.test.ts
```

---

## Interfaces

### `VideoGenerationPrompt`

```typescript
export interface VideoGenerationPrompt {
  text_prompt: string;       // prompt_plan에서 추출한 AI 프롬프트
  duration_sec: number;      // platform_output_spec에서 추출
  aspect_ratio: string;      // "9:16"
  style_tags: string[];      // 스타일 태그 배열
  motion_notes?: string;     // motion_plan에서 추출한 카메라 메모
}
```

### `VideoGenerationResult`

```typescript
export interface VideoGenerationResult {
  status: "success" | "error" | "dry_run";
  output_path?: string;               // 생성된 파일 경로 (success 시)
  error?: string;                     // 에러 메시지 (error 시)
  metadata: Record<string, unknown>;  // 어댑터별 추가 정보
}
```

### `VideoGenerationAdapter`

```typescript
export interface VideoGenerationAdapter {
  name: string;
  isAvailable(): Promise<boolean>;
  generate(
    prompt: VideoGenerationPrompt,
    options: { dry_run: boolean }
  ): Promise<VideoGenerationResult>;
}
```

---

## Adapter Behavior

| 어댑터 | `isAvailable()` | `generate()` |
|--------|----------------|--------------|
| `local` | 항상 `true` | `dry_run` 상태 반환, 파일 생성 없음 |
| `sora` | `SORA_API_KEY` env 존재 시 `true` | POST 뼈대, 키만 넣으면 동작 |
| `runway` | `RUNWAY_API_KEY` env 존재 시 `true` | 동일 |
| `kling` | `KLING_API_KEY` env 존재 시 `true` | 동일 |

---

## Adapter Registry

`execution_plan`의 `selected_backend` 값으로 어댑터를 선택한다.

| `selected_backend` | 선택 어댑터 |
|--------------------|------------|
| `local` | `local-adapter` |
| `gpu` | `local-adapter` (GPU 플래그 전달) |
| `sora` | `sora-adapter` → 불가 시 `local`로 폴백 |
| `premium` | `kling-adapter` → 불가 시 `runway-adapter` → 불가 시 `local`로 폴백 |
| `cache` | `local-adapter` (캐시 히트 시뮬레이션) |

---

## Data Flow

```
engine execute my-request.json
  │
  ├─ engine run 결과에서 execution_plan 로드
  │   (없으면 내부적으로 run 먼저 실행)
  │
  ├─ execution_plan.nodes 순회
  │   ├─ node.selected_backend → adapter-registry 조회
  │   ├─ adapter.isAvailable() → false면 local로 폴백
  │   ├─ prompt_plan에서 VideoGenerationPrompt 구성
  │   └─ adapter.generate(prompt, { dry_run }) 호출
  │
  └─ 결과를 my-request.execute-result.json으로 저장
```

---

## Environment Configuration

`.env` 파일 (사용자가 직접 작성, `.gitignore`에 포함):

```bash
SORA_API_KEY=your_key_here
RUNWAY_API_KEY=your_key_here
KLING_API_KEY=your_key_here
```

`.env.example` 파일을 저장소에 포함하여 사용자 안내.

---

## Error Handling

| 상황 | 동작 |
|------|------|
| API 키 없음 | `local`로 폴백, stderr에 경고 출력 |
| API 호출 실패 (4xx/5xx) | `execution_plan`의 폴백 경로로 재시도 1회 |
| 재시도도 실패 | `status: "error"` 기록 후 다음 노드 계속 진행 |
| `--dry-run` 플래그 | 모든 어댑터가 `dry_run` 결과 반환, 실제 호출 없음 |
| 알 수 없는 backend 값 | 에러 출력 후 해당 노드 건너뜀 |

---

## Output Format

`my-request.execute-result.json`:

```json
{
  "schema_version": "0.1",
  "request_id": "...",
  "executed_at": "2026-03-29T00:00:00Z",
  "dry_run": false,
  "nodes": [
    {
      "node_id": "...",
      "adapter": "local",
      "status": "dry_run",
      "output_path": null,
      "metadata": {}
    }
  ],
  "summary": {
    "total": 3,
    "success": 0,
    "dry_run": 3,
    "error": 0
  }
}
```

---

## Testing

- `local-adapter.test.ts` — `generate()` 반환값 구조 검증
- `adapter-registry.test.ts` — backend 이름 → 어댑터 매핑 검증, 폴백 동작 검증
- `execute-video-generation.test.ts` — mock 어댑터로 전체 흐름 통합 테스트

---

## Out of Scope

- 실제 Sora/Runway/Kling API 응답 파싱 (API가 GA되면 별도 PR)
- 생성된 파일의 후처리 (자르기, 합치기 등)
- TTS, 플랫폼 업로드 (2단계, 3단계에서 진행)
