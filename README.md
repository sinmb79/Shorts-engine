# Shorts Engine

**숏폼 영상 제작 자동화를 위한 오픈소스 기획 엔진**

유튜브 쇼츠 · TikTok · 인스타그램 릴스의 제작 계획을 JSON 요청 하나로 자동으로 세워주는 CLI 도구입니다.
실제 영상을 직접 생성하지는 않지만, AI 영상 생성·음성 합성·플랫폼 업로드까지 연결되는 **전체 제작 계획서**를 출력합니다.

---

## 목차

1. [이 엔진이 하는 일](#이-엔진이-하는-일)
2. [설치 방법](#설치-방법)
3. [5분 빠른 시작](#5분-빠른-시작)
4. [명령어 전체 목록](#명령어-전체-목록)
5. [요청 파일 만들기](#요청-파일-만들기)
6. [전체 제작 파이프라인](#전체-제작-파이프라인)
7. [API 키 설정](#api-키-설정)
8. [출력 결과 이해하기](#출력-결과-이해하기)
9. [비용 라우팅 규칙](#비용-라우팅-규칙)
10. [플랫폼별 영상 규격](#플랫폼별-영상-규격)
11. [테스트 실행](#테스트-실행)
12. [프로젝트 구조](#프로젝트-구조)
13. [자주 묻는 질문](#자주-묻는-질문)
14. [기여 방법](#기여-방법)

---

## 이 엔진이 하는 일

요청 파일(JSON) 하나를 넣으면 아래 항목을 자동으로 계산합니다.

| 단계 | 기능 | 설명 |
|------|------|------|
| 입력 | **대화형 마법사** | 질문에 답하면 요청 파일 자동 생성 |
| 검증 | **요청 검증·정규화** | 입력 형식 확인 및 표준화 |
| 기획 | **플랫폼 출력 스펙** | 유튜브·틱톡·릴스별 영상 규격 자동 적용 |
| 기획 | **모션 플래닝** | 카메라 움직임 패턴 계획 (반복 방지 포함) |
| 기획 | **B-roll 플래닝** | 장면별 보조 영상 클립 시맨틱 추천 |
| 기획 | **소설→숏츠 변환** | 소설 에피소드를 숏폼 시나리오로 자동 변환 |
| 결정 | **비용 라우팅** | 5가지 규칙으로 최적 처리 백엔드 자동 선택 |
| 결정 | **학습 상태** | 사용 횟수에 따라 개인화 수준 자동 조정 |
| 실행 | **실행 계획** | 노드별 재시도·폴백·비용 계획 생성 |
| 실행 | **회복 시뮬레이션** | 오류 발생 시 복구 경로 예측 |
| 출력 | **프롬프트 생성** | AI 영상 생성 도구용 프롬프트 자동 작성 |
| 출력 | **렌더 계획** | 렌더링 순서·방법 계획서 생성 |
| 출력 | **퍼블리시 계획** | 플랫폼별 업로드 메타데이터 자동 생성 |
| 출력 | **분석 리포트** | 전체 계획 품질 점수 및 경고 요약 |

---

## 설치 방법

### 1. Node.js 24+ 설치

https://nodejs.org 에서 LTS 버전을 설치합니다.

설치 확인:

```bash
node --version   # v24.x.x 이상이어야 함
```

### 2. 저장소 다운로드

```bash
git clone https://github.com/sinmb79/Shorts-engine.git
cd Shorts-engine
```

> git이 없으면 https://git-scm.com 에서 먼저 설치하세요.

### 3. 의존성 설치

```bash
npm install
```

---

## 5분 빠른 시작

### 방법 A — 대화형 마법사 (초보자 권장)

요청 파일을 직접 작성하기 어려울 때 사용합니다. 질문에 답하면 파일이 자동으로 만들어집니다.

```bash
# 마법사 실행 (파일명 지정)
npm run engine -- wizard my-video.json

# 마법사 완료 후 바로 실행
npm run engine -- run my-video.json
```

### 방법 B — 샘플 파일로 바로 실행

```bash
# 사람이 읽기 쉬운 형태로 출력
npm run engine -- run tests/fixtures/valid-low-cost-request.json

# JSON 형식으로 출력
npm run engine -- run tests/fixtures/valid-low-cost-request.json --json
```

### 방법 C — 프로필 템플릿으로 시작

사용 가능한 프로필 목록 확인:

```bash
npm run engine -- config
```

프로필로 요청 파일 생성:

```bash
npm run engine -- create <프로필명> my-video.json
npm run engine -- run my-video.json
```

---

## 명령어 전체 목록

| 명령어 | API 키 필요 | 설명 |
|--------|:-----------:|------|
| `engine wizard [파일]` | 불필요 | 대화형 마법사로 요청 파일 생성 |
| `engine run <파일>` | 불필요 | 전체 기획 파이프라인 실행 |
| `engine analyze <파일>` | 불필요 | 요청 분석 리포트 (readiness 점수 포함) |
| `engine prompt <파일>` | 불필요 | AI 영상 생성용 프롬프트 생성 |
| `engine render <파일>` | 불필요 | 렌더 계획서 생성 |
| `engine publish <파일>` | 불필요 | 플랫폼 업로드 계획서 생성 |
| `engine create <프로필> <파일>` | 불필요 | 프로필 기반 요청 파일 템플릿 생성 |
| `engine config [--json]` | 불필요 | 사용 가능한 프로필 목록 확인 |
| `engine doctor [--json]` | 불필요 | 시스템 환경 진단 |
| `engine execute <파일> [--dry-run]` | 필요 | 영상 생성 어댑터 호출 (Sora/Runway/Kling) |
| `engine tts <파일> [--dry-run]` | 필요 | 음성 합성 어댑터 호출 (ElevenLabs/OpenAI/Google) |
| `engine upload <파일> <영상.mp4> [--dry-run]` | 필요 | 플랫폼 업로드 (YouTube/TikTok/Instagram) |

> **`--dry-run`**: API 키 없이 어댑터 동작을 시뮬레이션합니다.
> **`--json`**: 출력을 JSON 형식으로 받습니다.

---

## 요청 파일 만들기

`tests/fixtures/valid-low-cost-request.json`을 복사해 수정하거나, 마법사(`engine wizard`)로 자동 생성할 수 있습니다.

```json
{
  "version": "0.1",
  "intent": {
    "topic": "만들고 싶은 영상 주제",
    "subject": "등장 인물 또는 사물",
    "goal": "영상의 목적",
    "emotion": "전달하고 싶은 감정",
    "platform": "youtube_shorts",
    "theme": "explainer",
    "duration_sec": 30
  },
  "constraints": {
    "language": "ko",
    "budget_tier": "low",
    "quality_tier": "balanced",
    "visual_consistency_required": true,
    "content_policy_safe": true
  },
  "style": {
    "hook_type": "curiosity",
    "pacing_profile": "fast_cut",
    "caption_style": "tiktok_viral",
    "camera_language": "simple_push_in"
  },
  "backend": {
    "preferred_engine": "local",
    "allow_fallback": true
  },
  "output": {
    "type": "video_prompt"
  }
}
```

### 주요 옵션 설명

**platform** — 업로드할 플랫폼

| 값 | 플랫폼 | 권장 길이 |
|----|--------|---------|
| `youtube_shorts` | 유튜브 쇼츠 | 30초 (15~60초) |
| `tiktok` | 틱톡 | 20초 (10~45초) |
| `instagram_reels` | 인스타그램 릴스 | 20초 (10~45초) |

**budget_tier** — 처리 비용 등급

| 값 | 설명 |
|----|------|
| `low` | 저비용 로컬 처리 (API 비용 없음) |
| `balanced` | 균형 잡힌 처리 |
| `high` | 고품질 프리미엄 처리 허용 |

**quality_tier** — 출력 품질 등급

| 값 | 설명 |
|----|------|
| `low` | 빠른 초안 |
| `balanced` | 일반 품질 |
| `premium` | 최고 품질 |

**preferred_engine** — 선호 영상 생성 엔진

| 값 | 설명 |
|----|------|
| `local` | 로컬 처리 (API 비용 없음) |
| `gpu` | GPU 가속 배치 처리 |
| `sora` | OpenAI Sora |
| `premium` | 최고 품질 프리미엄 엔진 |

**hook_type** — 영상 첫 3초 훅 유형

| 값 | 설명 |
|----|------|
| `curiosity` | 궁금증 유발 |
| `surprise` | 반전·충격 |
| `cliffhanger` | 긴장감·미완결 |
| `question` | 질문형 |

**pacing_profile** — 편집 속도

| 값 | 설명 |
|----|------|
| `fast_cut` | 빠른 컷 전환 (틱톡 스타일) |
| `slow_burn` | 느린 빌드업 |
| `dramatic_build` | 극적 긴장감 고조 |

---

## 전체 제작 파이프라인

기획부터 업로드까지 아래 순서로 실행합니다.

```
1. wizard   → 요청 파일 생성 (대화형)
      ↓
2. run      → 전체 기획 계획 확인 (플랫폼 스펙·모션·B-roll·비용 라우팅)
      ↓
3. execute  → 영상 생성 (Sora / Runway / Kling)
      ↓
4. tts      → 음성 합성 (ElevenLabs / OpenAI / Google TTS)
      ↓
5. upload   → 플랫폼 업로드 (YouTube / TikTok / Instagram)
```

**실제 예시:**

```bash
# 1. 요청 파일 생성
npm run engine -- wizard my-video.json

# 2. 기획 계획 확인
npm run engine -- run my-video.json

# 3. 상세 분석 리포트
npm run engine -- analyze my-video.json

# 4. AI 프롬프트 생성
npm run engine -- prompt my-video.json

# 5. 렌더 계획 확인
npm run engine -- render my-video.json

# 6. 업로드 계획 확인
npm run engine -- publish my-video.json

# 7. 영상 생성 (API 키 없으면 --dry-run으로 시뮬레이션)
npm run engine -- execute my-video.json --dry-run

# 8. 음성 합성
npm run engine -- tts my-video.json --dry-run

# 9. 업로드
npm run engine -- upload my-video.json output.mp4 --dry-run
```

---

## API 키 설정

`.env.example`을 복사해 `.env` 파일을 만들고 필요한 키를 입력합니다.

```bash
cp .env.example .env
# .env 파일을 텍스트 편집기로 열어 API 키 입력
```

> **API 키가 없어도 괜찮습니다.** 키가 없으면 자동으로 `local` 어댑터(dry-run 모드)로 동작합니다.

### 영상 생성 API

| 서비스 | 환경변수 | 발급 주소 |
|--------|----------|-----------|
| Sora (OpenAI) | `SORA_API_KEY` | https://openai.com/sora |
| Runway Gen-3 | `RUNWAY_API_KEY` | https://runwayml.com |
| Kling AI | `KLING_API_KEY` | https://klingai.com |

```bash
npm run engine -- execute my-video.json            # 실제 API 호출
npm run engine -- execute my-video.json --dry-run  # 시뮬레이션
```

### TTS 음성 합성 API

| 서비스 | 환경변수 | 발급 주소 |
|--------|----------|-----------|
| ElevenLabs | `ELEVENLABS_API_KEY` | https://elevenlabs.io |
| OpenAI TTS | `OPENAI_API_KEY` | https://platform.openai.com |
| Google TTS | `GOOGLE_TTS_API_KEY` | https://cloud.google.com/text-to-speech |

```bash
npm run engine -- tts my-video.json            # 실제 TTS 호출
npm run engine -- tts my-video.json --dry-run  # 시뮬레이션
```

> 나레이션 대본은 요청 파일의 `topic`, `goal`, `emotion`을 조합해 자동 생성됩니다.

### 플랫폼 업로드 API

| 서비스 | 환경변수 | 발급 주소 |
|--------|----------|-----------|
| YouTube | `YOUTUBE_CLIENT_ID` + `YOUTUBE_REFRESH_TOKEN` | https://developers.google.com/youtube/v3 |
| TikTok | `TIKTOK_ACCESS_TOKEN` | https://developers.tiktok.com |
| Instagram | `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_ACCOUNT_ID` | https://developers.facebook.com/docs/instagram-api |

```bash
npm run engine -- upload my-video.json video.mp4            # 실제 업로드
npm run engine -- upload my-video.json video.mp4 --dry-run  # 시뮬레이션
```

> 제목·설명·해시태그는 `topic`, `goal`, `theme`을 조합해 자동 생성됩니다.

---

## 출력 결과 이해하기

`--json` 플래그를 사용하면 아래 구조의 JSON이 출력됩니다.

```json
{
  "schema_version": "0.1",
  "request_id": "req_abc123",
  "validation": { "valid": true, "errors": [] },
  "normalized_request": {
    "base": { "platform": "youtube_shorts", "duration_sec": 30 },
    "derived": { "aspect_ratio": "9:16", "premium_allowed": false }
  },
  "platform_output_spec": {
    "platform": "youtube_shorts",
    "effective_duration_sec": 30,
    "warnings": []
  },
  "motion_plan": { "segments": [...] },
  "broll_plan": { "segments": [...] },
  "learning_state": {
    "phase": "bootstrapped",
    "weights": { "dataset": 0.80, "user": 0.20 }
  },
  "scoring": { "candidate_score": 0.72 },
  "routing": {
    "selected_backend": "local",
    "fallback_backend": "local",
    "reason_codes": ["local_backend_available"]
  },
  "execution_plan": { "nodes": [...], "edges": [...] },
  "recovery_simulation": {
    "normal_path": [...],
    "recovery_paths": [...]
  }
}
```

| 필드 | 설명 |
|------|------|
| `validation` | 요청 파일 형식 검증 결과 |
| `normalized_request` | 정규화된 요청 (base: 입력값, derived: 계산값) |
| `platform_output_spec` | 플랫폼 영상 규격 및 자동 보정 기록 |
| `motion_plan` | 구간별 카메라 움직임 계획 |
| `broll_plan` | 구간별 보조 영상 클립 시맨틱 추천 |
| `learning_state` | 현재 개인화 단계 및 가중치 |
| `scoring` | 후보 점수·품질 점수·비용 위험 점수 |
| `routing` | 선택된 처리 백엔드와 선택 이유 |
| `execution_plan` | 처리 노드 DAG (재시도·폴백·비용 포함) |
| `recovery_simulation` | 정상 경로 및 오류 복구 경로 |

---

## 비용 라우팅 규칙

5가지 결정론적 규칙으로 처리 방식을 자동 선택합니다.

| 규칙 | 조건 | 결과 |
|------|------|------|
| **Rule A** | 후보 점수 < 0.60 | 프리미엄 엔진 사용 안 함 |
| **Rule B** | 캐시 히트 발생 | 즉시 반환 (항상 최우선) |
| **Rule C** | 배치 크기 ≥ 5 이고 GPU 사용 가능 | GPU 처리 우선 |
| **Rule D** | 최종 고가치 단계만 | 프리미엄 엔진 허용 |
| **Rule E** | 재시도 비용 > 예상 이득 | 폴백 또는 스킵 |

---

## 플랫폼별 영상 규격

| 플랫폼 | 권장 | 최소 | 최대 | 핵심 요소 |
|--------|-----|------|------|----------|
| 유튜브 쇼츠 | 30초 | 15초 | 60초 | 검색 최적화, 훅 명확성 |
| 틱톡 | 20초 | 10초 | 45초 | 모션 에너지, 자막 즉시성 |
| 인스타그램 릴스 | 20초 | 10초 | 45초 | 시각적 일관성, 브랜드 완성도 |

요청 파일의 `duration_sec`이 범위를 벗어나면 자동으로 보정되고 `warnings`에 기록됩니다.

---

## 테스트 실행

```bash
npm test
```

120개 테스트가 모두 통과하면 정상입니다.

샘플 요청 파일은 `tests/fixtures/`에 있습니다.

| 파일 | 설명 |
|------|------|
| `valid-low-cost-request.json` | 기본 저비용 요청 |
| `novel-cliffhanger-request.json` | 소설→숏츠 변환 |
| `batch-gpu-request.json` | GPU 배치 처리 |
| `fallback-path-request.json` | 폴백 라우팅 |
| `tiktok-long-request.json` | 시간 초과 검증 (틱톡) |
| `invalid-request.json` | 잘못된 스키마 검증 |

---

## 프로젝트 구조

```
src/
  cli/          CLI 레이어 — 명령어 파싱, 파일 로드, 결과 렌더링
  domain/       핵심 비즈니스 로직 — 검증, 정규화, 점수 계산, 라우팅
  config/       프로필 카탈로그 및 기본 설정
  create/       요청 파일 템플릿 생성
  platform/     플랫폼별 영상 규격 (유튜브·틱톡·릴스)
  motion/       카메라 모션 패턴 및 반복 방지 규칙
  broll/        B-roll 시맨틱 개념 맵 (30개 핵심 개념)
  learning/     학습 상태 및 3단계 개인화 (bootstrapped → adaptive → personalized)
  novel/        소설→숏폼 변환 파이프라인
  prompt/       AI 영상 생성 프롬프트 생성
  render/       렌더 계획 생성
  publish/      퍼블리시 계획 생성
  analyze/      분석 리포트 생성
  simulation/   실행 계획 DAG 및 회복 시뮬레이션
  adapters/
    video/      영상 생성 어댑터 (local / sora / runway / kling)
    tts/        음성 합성 어댑터 (local / elevenlabs / openai / google)
    upload/     업로드 어댑터 (local / youtube / tiktok / instagram)
  execute/      어댑터 오케스트레이터 (영상·TTS·업로드 실행)
  doctor/       시스템 환경 진단
  shared/       공통 유틸리티
tests/
  fixtures/     테스트용 요청 파일 예시 (10개)
```

---

## 자주 묻는 질문

### Q: API 키가 없어도 사용할 수 있나요?

네. API 키가 없으면 자동으로 `local` 어댑터로 동작합니다.
`engine run`, `engine analyze`, `engine prompt`, `engine render`, `engine publish`는 API 키 없이 완전히 사용 가능합니다.
`engine execute`, `engine tts`, `engine upload`는 `--dry-run` 플래그로 시뮬레이션할 수 있습니다.

### Q: Node.js 버전이 24 미만이면 어떻게 되나요?

엔진이 실행되지 않습니다. `node --version`으로 확인 후 https://nodejs.org 에서 최신 LTS 버전을 설치하세요.

### Q: 소설을 숏츠로 변환하려면 어떻게 하나요?

요청 파일에 `novel` 키를 추가하고 `mode`를 지정합니다.

```json
{
  "novel": {
    "mode": "cliffhanger_short",
    "episode_text": "소설 에피소드 내용..."
  }
}
```

모드 종류:
- `cliffhanger_short` — 극적 긴장감·미완결
- `character_moment_short` — 캐릭터 감정·집중
- `lore_worldbuilding_short` — 세계관 설명

### Q: 학습 상태(learning_state)가 뭔가요?

사용 횟수에 따라 개인화 수준이 자동으로 올라갑니다.

| 단계 | 사용 횟수 | 데이터셋 가중치 | 사용자 가중치 |
|------|----------|--------------|------------|
| bootstrapped | 0~9회 | 80% | 20% |
| adaptive | 10~49회 | 50% | 50% |
| personalized | 50회+ | 20% | 80% |

### Q: `engine doctor`는 무슨 명령인가요?

현재 개발 환경이 정상인지 진단합니다. 테스트 픽스처 파일 유무, 명령어 카탈로그 상태 등을 확인합니다.

```bash
npm run engine -- doctor
npm run engine -- doctor --json   # JSON 출력
```

### Q: 출력 JSON을 다른 시스템에서 사용할 수 있나요?

네. `--json` 플래그를 사용하면 모든 명령어가 구조화된 JSON을 출력합니다. 파이프(|)나 리다이렉션(>)으로 다른 도구와 연결할 수 있습니다.

```bash
npm run engine -- run my-video.json --json > plan.json
```

---

## 기여 방법

1. 이 저장소를 Fork합니다.
2. 새 브랜치를 만듭니다: `git checkout -b feature/내기능`
3. 변경 후 테스트를 실행합니다: `npm test`
4. Pull Request를 보냅니다.

버그 신고나 기능 제안은 [GitHub Issues](https://github.com/sinmb79/Shorts-engine/issues)에 남겨주세요.

---

## 라이선스

MIT License — 자유롭게 사용·수정·배포할 수 있습니다.
