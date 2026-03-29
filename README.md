# Shorts Engine

**숏폼 영상 제작 자동화를 위한 오픈소스 기획 엔진입니다.**

유튜브 쇼츠, TikTok, 인스타그램 릴스 등 숏폼 영상의 제작 계획을 자동으로 세워주는 CLI 도구입니다.
실제 영상을 직접 만들지는 않지만, 어떤 영상을 어떻게 만들지에 대한 **전체 제작 계획서**를 JSON 또는 사람이 읽기 쉬운 형태로 출력합니다.

---

## 이 프로젝트가 하는 일

요청 파일(JSON) 하나를 넣으면 아래 항목을 자동으로 계산해 줍니다.

| 항목 | 설명 |
|------|------|
| **대화형 마법사** | 질문에 답하면 요청 파일 자동 생성 (`engine wizard`) |
| **요청 검증** | 입력이 올바른 형식인지 확인 |
| **정규화** | 입력을 표준 형태로 정리 |
| **플랫폼 출력 스펙** | 유튜브/틱톡/릴스별 영상 규격 자동 적용 |
| **소설→숏츠 플래닝** | 소설 에피소드를 숏폼 영상 시나리오로 변환 |
| **모션 플래닝** | 카메라 움직임 패턴 계획 (반복 방지 규칙 포함) |
| **B-roll 플래닝** | 장면에 어울리는 보조 영상 클립 추천 |
| **학습 상태** | 사용 횟수에 따라 개인화 수준 자동 조정 |
| **비용 라우팅** | 가장 저렴한 백엔드를 자동 선택 (5가지 규칙) |
| **실행 계획** | 각 노드별 재시도·폴백·비용 계획 생성 |
| **회복 시뮬레이션** | 오류 발생 시 자동 복구 경로 예측 |
| **프롬프트 생성** | AI 영상 생성 도구용 프롬프트 자동 작성 |
| **렌더 계획** | 실제 렌더링 순서와 방법 계획 |
| **퍼블리시 계획** | 각 플랫폼 업로드용 메타데이터 계획 |
| **분석 리포트** | 전체 계획 요약 및 품질 점수 |

---

## 설치 방법 (처음 하시는 분도 따라 하실 수 있어요)

### 1단계 — Node.js 설치

이 프로젝트를 실행하려면 **Node.js 24 이상**이 필요합니다.

1. [https://nodejs.org](https://nodejs.org) 에 접속합니다.
2. **LTS 버전** 다운로드 버튼을 클릭합니다.
3. 설치 파일을 실행하고 "Next"를 계속 눌러 설치를 완료합니다.
4. 터미널(명령 프롬프트 또는 PowerShell)을 열고 아래 명령어로 설치 확인:

```bash
node --version
```

`v24.x.x` 처럼 버전 번호가 나오면 성공입니다.

### 2단계 — 이 저장소 다운로드

터미널에서 아래 명령어를 순서대로 실행합니다.

```bash
git clone https://github.com/sinmb79/Shorts-engine.git
cd Shorts-engine
```

> **git이 없다면?** [https://git-scm.com](https://git-scm.com) 에서 Git을 먼저 설치하세요.

### 3단계 — 의존성 설치

```bash
npm install
```

설치가 완료되면 바로 사용하실 수 있습니다.

---

## 사용 방법

### 기본 실행 (사람이 읽기 쉬운 출력)

```bash
npm run engine -- run tests/fixtures/valid-low-cost-request.json
```

### JSON 형식으로 출력

```bash
npm run engine -- run tests/fixtures/valid-low-cost-request.json --json
```

### 처음 시작할 때 — 대화형 설정 마법사

요청 파일을 직접 작성하기 어렵다면 **마법사**를 사용하세요.
질문에 답하는 것만으로 요청 파일이 자동으로 만들어집니다.

```bash
npm run engine -- wizard my-request.json
```

또는 파일 이름을 생략하면 `my-request.json`으로 저장됩니다:

```bash
npm run engine -- wizard
```

마법사가 끝나면 아래 명령어로 바로 실행할 수 있습니다:

```bash
npm run engine -- run my-request.json
```

---

### 사용 가능한 모든 명령어

| 명령어 | 설명 |
|--------|------|
| `engine wizard [파일]` | **대화형 마법사** — 질문에 답하며 요청 파일 생성 |
| `engine execute <파일> [--dry-run]` | 실제 영상 생성 어댑터 호출 (API 키 필요) |
| `engine tts <파일> [--dry-run]` | TTS 음성 합성 어댑터 호출 (API 키 필요) |
| `engine upload <파일> <영상.mp4> [--dry-run]` | 플랫폼 업로드 어댑터 호출 (API 토큰 필요) |
| `engine run <파일>` | 전체 파이프라인 실행 및 결과 출력 |
| `engine create <프로파일>` | 요청 파일 템플릿 자동 생성 |
| `engine render <파일>` | 렌더 계획 생성 |
| `engine prompt <파일>` | AI 생성 도구용 프롬프트 생성 |
| `engine publish <파일>` | 플랫폼 업로드 계획 생성 |
| `engine analyze <파일>` | 요청 분석 리포트 생성 |
| `engine config --json` | 사용 가능한 프로파일 목록 확인 |
| `engine doctor` | 시스템 상태 진단 |

---

## 나만의 요청 파일 만들기

`tests/fixtures/valid-low-cost-request.json` 을 복사해서 원하는 내용으로 수정하세요.

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

**platform** (플랫폼)
- `youtube_shorts` — 유튜브 쇼츠 (15~60초)
- `tiktok` — 틱톡 (10~45초)
- `instagram_reels` — 인스타그램 릴스 (10~45초)

**budget_tier** (예산 등급)
- `low` — 저비용 로컬 처리
- `balanced` — 균형 잡힌 처리
- `high` — 고품질 처리 허용

**quality_tier** (품질 등급)
- `low` — 빠른 초안
- `balanced` — 일반 품질
- `premium` — 최고 품질

**preferred_engine** (선호 엔진)
- `local` — 로컬 처리 (비용 없음)
- `gpu` — GPU 가속
- `sora` / `premium` — 프리미엄 AI 엔진

---

## 출력 결과 이해하기

`--json` 플래그를 사용하면 아래와 같은 구조의 JSON이 출력됩니다.

```json
{
  "schema_version": "0.1",
  "request_id": "...",
  "validation": { "valid": true, "errors": [] },
  "normalized_request": { "base": {}, "derived": {} },
  "platform_output_spec": {
    "platform": "youtube_shorts",
    "effective_duration_sec": 30,
    "warnings": []
  },
  "motion_plan": { "segments": [...] },
  "broll_plan": { "segments": [...] },
  "learning_state": { "phase": "bootstrapped", "weights": {} },
  "scoring": { "candidate_score": 0.72 },
  "routing": {
    "selected_backend": "local",
    "reason_codes": ["local_backend_available"]
  },
  "execution_plan": { "nodes": [...], "edges": [...] },
  "recovery_simulation": { "normal_path": [...], "recovery_paths": [...] }
}
```

| 필드 | 설명 |
|------|------|
| `validation` | 요청 파일이 올바른지 여부 |
| `platform_output_spec` | 플랫폼별 영상 규격 및 자동 보정 결과 |
| `motion_plan` | 카메라 움직임 계획 |
| `broll_plan` | 보조 영상 클립 추천 목록 |
| `learning_state` | 현재 개인화 단계 (bootstrapped → adaptive → personalized) |
| `routing` | 선택된 처리 방식과 이유 |
| `execution_plan` | 처리 순서와 각 단계 비용 |
| `recovery_simulation` | 오류 발생 시 복구 경로 |

---

## 테스트 실행

```bash
npm test
```

120개 테스트가 모두 통과하면 정상입니다.

---

## 전체 제작 파이프라인

아래 순서로 명령어를 실행하면 기획부터 업로드까지 전 과정을 자동화할 수 있습니다.

```
1. wizard     → 요청 파일 생성 (대화형)
2. run        → 전체 기획 계획 생성 (플랫폼 스펙, 모션, B-roll 등)
3. execute    → 영상 생성 어댑터 호출 (Sora / Runway / Kling)
4. tts        → 음성 합성 어댑터 호출 (ElevenLabs / OpenAI / Google TTS)
5. upload     → 플랫폼 업로드 어댑터 호출 (YouTube / TikTok / Instagram)
```

**예시 (전체 흐름):**

```bash
# 1. 요청 파일 생성
npm run engine -- wizard my-video.json

# 2. 기획 계획 확인
npm run engine -- run my-video.json

# 3. 영상 생성 (API 키 없으면 dry_run으로 동작)
npm run engine -- execute my-video.json --dry-run

# 4. 음성 합성
npm run engine -- tts my-video.json --dry-run

# 5. 플랫폼 업로드
npm run engine -- upload my-video.json output.mp4 --dry-run
```

---

## 프로젝트 구조

```
src/
  cli/          명령줄 인터페이스 (명령어 처리)
  domain/       핵심 비즈니스 로직 (검증, 정규화, 라우팅)
  adapters/
    video/      영상 생성 어댑터 (local / sora / runway / kling)
    tts/        음성 합성 어댑터 (local / elevenlabs / openai / google)
    upload/     플랫폼 업로드 어댑터 (local / youtube / tiktok / instagram)
  execute/      어댑터 오케스트레이터 (영상·TTS·업로드 실행)
  platform/     플랫폼별 영상 규격 (유튜브, 틱톡, 릴스)
  motion/       카메라 모션 패턴 규칙
  broll/        B-roll 시맨틱 매핑
  learning/     학습 상태 및 개인화
  novel/        소설→숏폼 변환 파이프라인
  prompt/       AI 프롬프트 생성
  render/       렌더 계획 생성
  publish/      퍼블리시 계획 생성
  analyze/      분석 리포트 생성
  simulation/   실행 계획 및 회복 시뮬레이션
  shared/       공통 유틸리티
tests/
  fixtures/     테스트용 요청 파일 예시들
```

---

## 비용 라우팅 규칙

이 엔진은 5가지 결정론적 규칙으로 가장 저렴한 처리 방식을 자동 선택합니다.

| 규칙 | 내용 |
|------|------|
| Rule A | 후보 점수가 0.6 미만이면 프리미엄 엔진 사용 안 함 |
| Rule B | 캐시 히트 시 즉시 반환 (항상 최우선) |
| Rule C | 배치 크기 5개 이상 + GPU 사용 가능 시 GPU 우선 |
| Rule D | 프리미엄 엔진은 최종 고가치 단계에만 허용 |
| Rule E | 재시도 비용이 예상 이득보다 크면 폴백으로 직행 |

---

## 플랫폼별 영상 규격

| 플랫폼 | 권장 길이 | 최소 | 최대 | 특징 |
|--------|-----------|------|------|------|
| 유튜브 쇼츠 | 30초 | 15초 | 60초 | 검색 최적화, 훅 명확성 중시 |
| 틱톡 | 20초 | 10초 | 45초 | 모션 에너지, 자막 즉시성 중시 |
| 인스타그램 릴스 | 20초 | 10초 | 45초 | 시각적 일관성, 브랜드 완성도 중시 |

요청 파일의 `duration_sec`이 플랫폼 범위를 벗어나면 자동으로 보정되고 `warnings`에 기록됩니다.

---

## API 키 설정 방법

`.env.example`을 복사하여 `.env` 파일을 만들고, 사용하려는 서비스의 API 키를 입력하세요.

```bash
cp .env.example .env
# .env 파일을 텍스트 편집기로 열어 API 키 입력
```

**API 키가 없어도 괜찮습니다.** 키가 없는 경우 자동으로 `local` 어댑터(dry_run 모드)로 동작합니다.

---

### 영상 생성 API

| 서비스 | 환경변수 | 발급 주소 |
|--------|----------|-----------|
| Sora | `SORA_API_KEY` | https://openai.com/sora |
| Runway | `RUNWAY_API_KEY` | https://runwayml.com |
| Kling | `KLING_API_KEY` | https://klingai.com |

```bash
npm run engine -- execute my-request.json           # 실제 API 호출
npm run engine -- execute my-request.json --dry-run # 테스트 (API 호출 없음)
```

---

### TTS 음성 합성 API

| 서비스 | 환경변수 | 발급 주소 |
|--------|----------|-----------|
| ElevenLabs | `ELEVENLABS_API_KEY` | https://elevenlabs.io |
| OpenAI TTS | `OPENAI_API_KEY` | https://platform.openai.com |
| Google TTS | `GOOGLE_TTS_API_KEY` | https://cloud.google.com/text-to-speech |

```bash
npm run engine -- tts my-request.json           # 실제 TTS API 호출
npm run engine -- tts my-request.json --dry-run # 테스트 (API 호출 없음)
```

나레이션 대본은 요청 파일의 `topic`, `goal`, `emotion`을 조합해 자동 생성됩니다.

---

### 플랫폼 업로드 API

| 서비스 | 환경변수 | 발급 주소 |
|--------|----------|-----------|
| YouTube | `YOUTUBE_CLIENT_ID` + `YOUTUBE_REFRESH_TOKEN` | https://developers.google.com/youtube/v3 |
| TikTok | `TIKTOK_ACCESS_TOKEN` | https://developers.tiktok.com |
| Instagram | `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_ACCOUNT_ID` | https://developers.facebook.com/docs/instagram-api |

```bash
npm run engine -- upload my-request.json video.mp4           # 실제 플랫폼 업로드
npm run engine -- upload my-request.json video.mp4 --dry-run # 테스트 (업로드 없음)
```

업로드 제목, 설명, 해시태그는 요청 파일의 `topic`, `goal`, `theme`을 조합해 자동 생성됩니다.

---

## 현재 구현되지 않은 기능

이 프로젝트는 **기획·계획 단계**만 시뮬레이션합니다. 아래 기능은 추후 추가 예정입니다.

- 실제 영상 생성 — 어댑터 프레임워크 구현 완료. Sora/Runway/Kling API 키를 `.env`에 추가하면 실제 생성 가능 (각 서비스의 공개 API 상태에 따라 다름)
- 실제 TTS (음성 합성) — 어댑터 프레임워크 구현 완료. ElevenLabs/OpenAI/Google TTS API 키를 `.env`에 추가하면 실제 생성 가능
- 플랫폼 업로드 (YouTube, TikTok, Instagram) — 어댑터 프레임워크 구현 완료. 각 플랫폼 API 토큰을 `.env`에 추가하면 실제 업로드 가능

---

## 기여 방법

1. 이 저장소를 Fork합니다.
2. 새 브랜치를 만듭니다: `git checkout -b feature/내기능`
3. 변경 후 테스트를 실행합니다: `npm test`
4. Pull Request를 보냅니다.

---

## 라이선스

MIT License — 자유롭게 사용, 수정, 배포하실 수 있습니다.

---

## 문의 및 이슈

버그 신고나 기능 제안은 [GitHub Issues](https://github.com/sinmb79/Shorts-engine/issues)에 남겨주세요.
