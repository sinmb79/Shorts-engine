# Upload Adapter — Design Spec

**Date:** 2026-03-29
**Scope:** 3단계 — 플랫폼 업로드 실행 레이어
**Status:** Approved

---

## Overview

`engine upload <요청파일.json> <영상경로.mp4>` 명령어로 PublishPlan을 구성하고 플랫폼 업로드 어댑터를 통해 영상을 YouTube Shorts, TikTok, Instagram Reels에 업로드한다. 사용자는 `.env`에 API 토큰만 넣으면 실제 업로드가 가능하며, 토큰이 없으면 `local` 어댑터로 자동 폴백된다.

---

## New CLI Command

```bash
engine upload <요청파일.json> <영상경로.mp4>            # 실제 플랫폼 업로드
engine upload <요청파일.json> <영상경로.mp4> --dry-run  # API 호출 없이 설정 검증만
```

---

## File Structure

```
src/
  adapters/
    upload/
      upload-adapter.ts              인터페이스 및 타입 정의
      upload-adapter-registry.ts     platform → 어댑터 매핑 + 폴백
      local-upload-adapter.ts        완전 구현 (항상 dry_run 반환)
      youtube-upload-adapter.ts      뼈대 (YOUTUBE_CLIENT_ID + YOUTUBE_REFRESH_TOKEN)
      tiktok-upload-adapter.ts       뼈대 (TIKTOK_ACCESS_TOKEN)
      instagram-upload-adapter.ts    뼈대 (INSTAGRAM_ACCESS_TOKEN + INSTAGRAM_ACCOUNT_ID)
  execute/
    execute-upload.ts                PublishPlan 구성 + 업로드 어댑터 호출
  cli/
    upload-engine-command.ts         engine upload 명령어 핸들러
tests/
  adapters/
    upload/
      local-upload-adapter.test.ts
      upload-adapter-registry.test.ts
      execute-upload.test.ts
  cli/
    upload-command.test.ts
```

---

## Interfaces

### `UploadRequest`

```typescript
export interface UploadRequest {
  video_path: string;
  title: string;
  description: string;
  hashtags: string[];
  platform: Platform;
}
```

### `UploadResult`

```typescript
export interface UploadResult {
  status: "success" | "error" | "dry_run";
  post_url?: string;
  post_id?: string;
  error?: string;
  metadata: Record<string, unknown>;
}
```

### `UploadOptions`

```typescript
export interface UploadOptions {
  dry_run: boolean;
}
```

### `UploadAdapter`

```typescript
export interface UploadAdapter {
  name: string;
  platform: Platform;
  isAvailable(): Promise<boolean>;
  upload(request: UploadRequest, options: UploadOptions): Promise<UploadResult>;
}
```

---

## Adapter Behavior

| 어댑터 | `isAvailable()` | `upload()` |
|--------|----------------|------------|
| `local` | 항상 `true` | `dry_run` 상태 반환, 업로드 없음 |
| `youtube` | `YOUTUBE_CLIENT_ID` + `YOUTUBE_REFRESH_TOKEN` 존재 시 `true` | POST 뼈대, 키만 넣으면 동작 |
| `tiktok` | `TIKTOK_ACCESS_TOKEN` 존재 시 `true` | 동일 |
| `instagram` | `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_ACCOUNT_ID` 존재 시 `true` | 동일 |

---

## Adapter Registry

Stage 1/2와 달리 업로드는 `ExecutionBackend`가 아닌 `Platform`으로 어댑터를 선택한다.

| `platform` | 선택 어댑터 |
|------------|------------|
| `youtube_shorts` | youtube → local |
| `tiktok` | tiktok → local |
| `instagram_reels` | instagram → local |

---

## Data Flow

```
engine upload my-request.json video.mp4
  ├─ loadEngineRequest → validate
  ├─ resolvePlanningContext → platform, PublishPlan 구성
  ├─ buildUploadRequest(context, video_path) → UploadRequest
  ├─ resolveUploadAdapter(platform) → adapter
  ├─ adapter.isAvailable() → false면 local 폴백
  ├─ adapter.upload(request, { dry_run }) 호출
  └─ 결과를 my-request.upload-result.json 저장
```

업로드는 플랫폼당 1회 (단일 결과). execution_plan 노드 순회 없음.

---

## Upload Request Auto-Generation

`resolvePlanningContext`에서 구성된 PublishPlan을 재활용한다:

```
title       = PublishPlan.title
description = PublishPlan.description
hashtags    = PublishPlan.hashtags
platform    = PublishPlan.platform
video_path  = CLI 인자로 전달
```

---

## Output Format

`my-request.upload-result.json`:

```json
{
  "schema_version": "0.1",
  "executed_at": "2026-03-29T00:00:00Z",
  "dry_run": false,
  "platform": "youtube_shorts",
  "adapter": "local",
  "status": "dry_run",
  "post_url": null,
  "post_id": null,
  "metadata": {}
}
```

---

## Error Handling

| 상황 | 동작 |
|------|------|
| API 토큰 없음 | local 폴백, stderr 경고 |
| 영상 파일 없음 | 즉시 오류 반환 (`exitCode` 비정상) |
| API 호출 실패 | `status: "error"` 기록 |
| `--dry-run` | 어댑터 dry_run 반환 |

---

## Environment Configuration

`.env.example`에 추가:

```bash
# YouTube Data API v3 - https://developers.google.com/youtube/v3
YOUTUBE_CLIENT_ID=your_youtube_client_id_here
YOUTUBE_REFRESH_TOKEN=your_youtube_refresh_token_here

# TikTok for Developers - https://developers.tiktok.com
TIKTOK_ACCESS_TOKEN=your_tiktok_access_token_here

# Instagram Graph API - https://developers.facebook.com/docs/instagram-api
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
INSTAGRAM_ACCOUNT_ID=your_instagram_account_id_here
```

---

## Differences from Stage 1 & 2

- **선택 키**: `ExecutionBackend` 대신 `Platform` 으로 어댑터 선택
- **단일 결과**: execution_plan 노드 순회 없음. 플랫폼 당 1회 업로드
- **추가 입력**: `video_path` CLI 인자 필요
- **결과 필드**: `post_url`, `post_id` 추가

---

## Out of Scope

- OAuth2 인증 흐름 (access token 발급 UI/CLI)
- 영상 트랜스코딩 또는 포맷 변환
- 업로드 진행률 표시
- 예약 게시 (scheduled publishing)
