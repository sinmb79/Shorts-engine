# TTS Adapter — Design Spec

**Date:** 2026-03-29
**Scope:** 2단계 — TTS 실행 레이어
**Status:** Approved

---

## Overview

`engine tts` 명령어로 execution_plan을 실행해 나레이션 오디오 파일을 생성한다. 사용자는 `.env`에 API 키만 넣으면 ElevenLabs, OpenAI TTS, Google TTS를 통해 실제 음성을 합성할 수 있다. API 키가 없으면 `local` 어댑터로 자동 폴백된다.

---

## New CLI Command

```bash
engine tts <요청파일.json>            # 실제 TTS API 호출
engine tts <요청파일.json> --dry-run  # API 호출 없이 설정 검증만
```

---

## File Structure

```
src/
  adapters/
    tts/
      tts-adapter.ts              인터페이스 및 타입 정의
      tts-adapter-registry.ts     backend → 어댑터 매핑 + 폴백
      local-tts-adapter.ts        완전 구현 (API 키 불필요)
      elevenlabs-adapter.ts       뼈대 (ELEVENLABS_API_KEY)
      openai-tts-adapter.ts       뼈대 (OPENAI_API_KEY)
      google-tts-adapter.ts       뼈대 (GOOGLE_TTS_API_KEY)
  execute/
    execute-tts.ts                execution_plan 순회 + TTS 어댑터 호출
  cli/
    tts-engine-command.ts         engine tts 명령어 핸들러
tests/
  adapters/
    tts/
      local-tts-adapter.test.ts
      tts-adapter-registry.test.ts
      execute-tts.test.ts
  cli/
    tts-command.test.ts
```

---

## Interfaces

### `TtsRequest`

```typescript
export interface TtsRequest {
  text: string;
  language: string;
  voice_style: "neutral" | "energetic" | "dramatic";
  duration_hint_sec: number;
}
```

### `TtsResult`

```typescript
export interface TtsResult {
  status: "success" | "error" | "dry_run";
  output_path?: string;
  error?: string;
  metadata: Record<string, unknown>;
}
```

### `TtsOptions`

```typescript
export interface TtsOptions {
  dry_run: boolean;
  output_dir?: string;
}
```

### `TtsAdapter`

```typescript
export interface TtsAdapter {
  name: string;
  isAvailable(): Promise<boolean>;
  synthesize(request: TtsRequest, options: TtsOptions): Promise<TtsResult>;
}
```

---

## Narration Script Auto-Generation

`effective_request`에서 다음과 같이 나레이션 대본을 자동 생성한다:

```
text = `${topic}. ${goal}. ${emotion}.`
```

예: `"AI 생산성 도구. 제품을 간단하게 소개하기. 호기심과 만족감."`

### voice_style 매핑

| `hook_type` | `voice_style` |
|-------------|---------------|
| `curiosity`, `question` | `"neutral"` |
| `surprise` | `"energetic"` |
| `cliffhanger` | `"dramatic"` |
| 그 외 | `"neutral"` |

---

## Adapter Behavior

| 어댑터 | `isAvailable()` | `synthesize()` |
|--------|----------------|----------------|
| `local` | 항상 `true` | `dry_run` 상태 반환, 파일 생성 없음 |
| `elevenlabs` | `ELEVENLABS_API_KEY` 존재 시 `true` | POST 뼈대, 키만 넣으면 동작 |
| `openai_tts` | `OPENAI_API_KEY` 존재 시 `true` | 동일 |
| `google_tts` | `GOOGLE_TTS_API_KEY` 존재 시 `true` | 동일 |

---

## Adapter Registry

| `selected_backend` | 선택 어댑터 |
|--------------------|------------|
| `local` / `gpu` / `cache` | local |
| `sora` | openai_tts → local |
| `premium` | elevenlabs → openai_tts → google_tts → local |

---

## Data Flow

```
engine tts my-request.json
  ├─ loadEngineRequest → validate
  ├─ resolvePlanningContext → execution_plan
  ├─ execution_plan.nodes 순회
  │   ├─ node.backend → tts-adapter-registry 조회
  │   ├─ adapter.isAvailable() → false면 local 폴백
  │   ├─ buildTtsRequestFromContext() → TtsRequest 구성
  │   └─ adapter.synthesize(request, { dry_run }) 호출
  └─ 결과를 my-request.tts-result.json 저장
```

---

## Output Format

`my-request.tts-result.json`:

```json
{
  "schema_version": "0.1",
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
  "summary": { "total": 3, "success": 0, "dry_run": 3, "error": 0 }
}
```

---

## Error Handling

| 상황 | 동작 |
|------|------|
| API 키 없음 | local 폴백, stderr 경고 |
| API 호출 실패 | `status: "error"` 기록, 다음 노드 계속 |
| `--dry-run` | 모든 어댑터 dry_run 반환 |

---

## Environment Configuration

`.env.example`에 추가:

```bash
# ElevenLabs - https://elevenlabs.io
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# OpenAI TTS - https://platform.openai.com
OPENAI_API_KEY=your_openai_api_key_here

# Google Cloud TTS - https://cloud.google.com/text-to-speech
GOOGLE_TTS_API_KEY=your_google_tts_api_key_here
```

---

## Out of Scope

- 생성된 오디오와 영상 파일 합치기
- 플랫폼 업로드 (3단계)
- 대본 품질 최적화 (AI 프롬프트 기반)
