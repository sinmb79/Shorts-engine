# Shorts Engine

**유튜브 쇼츠 · TikTok · 인스타그램 릴스 제작 계획을 자동으로 세워주는 오픈소스 CLI 도구입니다.**

---

처음 보시는 분들께 먼저 한 말씀 드릴게요.

이 도구는 "영상을 직접 만들어 주는 AI"가 아닙니다.
그보다 한 단계 앞에서, **"어떤 영상을 어떻게 만들 것인가"를 자동으로 계획해 주는 기획 엔진**입니다.

마치 영화 감독이 촬영 전에 콘티를 짜고, 어떤 카메라 앵글을 쓸지, 어떤 배경 음악을 쓸지, 어떤 플랫폼에 올릴지 미리 설계하는 것처럼 — 이 엔진이 그 과정을 자동화합니다.

계획서가 완성되면, Sora · Runway · ElevenLabs 같은 실제 AI 도구에 연결해 영상을 만들고 유튜브·틱톡·인스타그램에 업로드하는 것까지 이어갈 수 있습니다.

---

## 목차

1. [이 도구가 하는 일](#1-이-도구가-하는-일)
2. [시작 전 준비물](#2-시작-전-준비물)
3. [설치하기](#3-설치하기)
4. [처음 실행해 보기](#4-처음-실행해-보기)
5. [나만의 영상 기획하기](#5-나만의-영상-기획하기)
6. [명령어 완전 정복](#6-명령어-완전-정복)
7. [요청 파일 옵션 설명서](#7-요청-파일-옵션-설명서)
8. [출력 결과 읽는 법](#8-출력-결과-읽는-법)
9. [API 연결하기 (영상·음성·업로드)](#9-api-연결하기-영상음성업로드)
10. [전체 제작 파이프라인](#10-전체-제작-파이프라인)
11. [플랫폼별 영상 규격](#11-플랫폼별-영상-규격)
12. [비용 자동 절감 규칙](#12-비용-자동-절감-규칙)
13. [테스트 실행하기](#13-테스트-실행하기)
14. [막혔을 때 (FAQ)](#14-막혔을-때-faq)
15. [프로젝트 구조 이해하기](#15-프로젝트-구조-이해하기)
16. [기여하기](#16-기여하기)

---

## 1. 이 도구가 하는 일

요청 파일(JSON) 하나를 주면 아래를 자동으로 계산해 줍니다.

| 무엇을 | 어떻게 |
|--------|--------|
| 플랫폼 규격 | 유튜브 30초, 틱톡 20초처럼 플랫폼별 최적 길이를 자동으로 맞춰줍니다 |
| 카메라 모션 계획 | zoom_in, pan_left 같은 카메라 움직임을 구간별로 배치합니다. 같은 동작이 반복되지 않도록 규칙도 적용합니다 |
| B-roll 추천 | "성장"이라는 주제면 식물이 자라는 클립을, "혁신"이라는 주제면 전구·로켓 이미지를 시맨틱으로 추천합니다 |
| AI 프롬프트 생성 | Sora·Runway·Kling에 넣을 영상 생성 프롬프트를 자동으로 작성합니다 |
| 비용 최적 경로 | 5가지 규칙으로 가장 저렴한 처리 방식을 자동 선택합니다 |
| 오류 복구 계획 | API가 실패했을 때 어떤 대안 경로를 쓸지 미리 시뮬레이션합니다 |
| 소설→숏츠 변환 | 소설 에피소드를 클리프행어·캐릭터 감정·세계관 소개 영상으로 변환합니다 |
| 업로드 계획 | 제목·설명·해시태그를 주제에 맞게 자동 생성합니다 |
| 분석 리포트 | 전체 계획 품질을 점수로 평가하고 개선 포인트를 알려줍니다 |

---

## 2. 시작 전 준비물

두 가지만 설치하면 됩니다.

### Node.js 24 이상

이 엔진을 실행하는 기반 런타임입니다.

1. https://nodejs.org 에 접속합니다.
2. **LTS** 버튼을 클릭해 설치 파일을 받습니다.
3. 설치 파일을 실행하고 "Next"를 계속 눌러 완료합니다.

설치가 끝났으면 터미널(PowerShell이나 명령 프롬프트)을 열고 확인합니다:

```bash
node --version
```

`v24.x.x` 형태로 버전이 나오면 성공입니다.
`v22` 이하가 나오면 최신 LTS 버전으로 다시 설치해야 합니다.

### Git

코드를 내려받는 데 필요합니다.

1. https://git-scm.com 에 접속합니다.
2. 운영체제에 맞는 설치 파일을 받아 설치합니다.
3. 설치 후 터미널에서 확인:

```bash
git --version
```

버전 번호가 나오면 준비 완료입니다.

---

## 3. 설치하기

터미널을 열고 아래 세 명령어를 순서대로 실행하세요.

```bash
# 1. 저장소 내려받기
git clone https://github.com/sinmb79/Shorts-engine.git

# 2. 폴더로 이동
cd Shorts-engine

# 3. 필요한 패키지 설치
npm install
```

`npm install`은 처음엔 1~2분 걸릴 수 있어요. 화면에 뭔가 쭉 지나가면 정상입니다. 에러 없이 끝나면 준비 완료입니다.

> **설치가 완료됐는지 확인하고 싶다면:**
> ```bash
> npm test
> ```
> 120개 테스트가 모두 통과하면 완벽하게 설치된 것입니다.

---

## 4. 처음 실행해 보기

설치가 끝났으면 바로 실행해 볼 수 있습니다.
이미 준비된 샘플 파일로 엔진을 돌려봅시다.

```bash
npm run engine -- run tests/fixtures/valid-low-cost-request.json
```

화면에 계획서가 출력될 거예요. 처음엔 내용이 많아 보일 수 있는데, 천천히 읽어보면 "아, 이런 걸 계산해 주는구나" 하고 이해가 됩니다.

JSON 형식으로 보고 싶으면:

```bash
npm run engine -- run tests/fixtures/valid-low-cost-request.json --json
```

다른 샘플 파일들도 실행해 보세요. `tests/fixtures/` 폴더에 여러 상황별 예시가 있습니다:

| 파일 이름 | 어떤 상황인가요 |
|----------|---------------|
| `valid-low-cost-request.json` | 가장 기본적인 저비용 요청 |
| `novel-cliffhanger-request.json` | 소설을 클리프행어 숏츠로 변환 |
| `batch-gpu-request.json` | GPU로 여러 영상 한꺼번에 처리 |
| `tiktok-long-request.json` | 틱톡 최대 시간을 넘긴 경우 (자동 보정 확인) |
| `invalid-request.json` | 잘못된 요청 (에러 처리 확인) |

---

## 5. 나만의 영상 기획하기

샘플 파일을 직접 수정하거나, 마법사를 사용해 새 요청 파일을 만들 수 있습니다.

### 방법 A — 마법사 사용 (가장 쉬운 방법)

직접 JSON을 작성하기 어려울 때는 마법사를 쓰세요.
질문에 답하는 것만으로 요청 파일이 자동으로 만들어집니다.

```bash
npm run engine -- wizard my-video.json
```

마법사가 물어볼 것들:
- 어떤 플랫폼에 올릴 건가요? (유튜브/틱톡/릴스)
- 예산은 어느 정도인가요?
- 원하는 품질은요?
- 영상의 첫 훅은 어떤 방식으로?
- 편집 속도는 빠르게, 느리게, 아니면 극적으로?

마법사가 끝나면 바로 실행해 보세요:

```bash
npm run engine -- run my-video.json
```

### 방법 B — 직접 작성

`tests/fixtures/valid-low-cost-request.json`을 복사해서 내용을 바꾸면 됩니다.

```bash
# 복사 (Windows PowerShell)
Copy-Item tests/fixtures/valid-low-cost-request.json my-video.json

# 복사 (macOS / Linux)
cp tests/fixtures/valid-low-cost-request.json my-video.json
```

복사한 파일을 텍스트 편집기로 열어서 `topic`, `goal`, `emotion` 같은 값을 원하는 내용으로 바꾸세요.

### 방법 C — 프로필 템플릿 사용

엔진에 내장된 프로필 목록을 확인합니다:

```bash
npm run engine -- config
```

원하는 프로필로 요청 파일을 만듭니다:

```bash
npm run engine -- create <프로필명> my-video.json
```

---

## 6. 명령어 완전 정복

엔진에서 사용할 수 있는 명령어 12개를 모두 설명합니다.

### `engine wizard` — 대화형 마법사

```bash
npm run engine -- wizard [파일명.json]
```

처음 사용자에게 가장 추천하는 진입점입니다.
파일명을 생략하면 `my-request.json`으로 저장됩니다.

---

### `engine run` — 전체 기획 계획 실행

```bash
npm run engine -- run <파일명.json>
npm run engine -- run <파일명.json> --json
```

핵심 명령어입니다. 요청 파일을 넣으면 전체 13단계 파이프라인이 실행되고 완성된 계획서가 출력됩니다.
`--json` 플래그를 붙이면 JSON 형식으로 출력되어 다른 도구에 연결하기 좋습니다.

---

### `engine analyze` — 분석 리포트

```bash
npm run engine -- analyze <파일명.json>
```

`run` 명령보다 간결한 요약 보고서를 줍니다.
readiness 점수(준비도), risk 점수(위험도), 추천 백엔드, 경고 수를 한눈에 볼 수 있어요.
요청 파일이 괜찮은지 빠르게 진단할 때 유용합니다.

---

### `engine prompt` — AI 프롬프트 생성

```bash
npm run engine -- prompt <파일명.json>
```

Sora · Runway · Kling 같은 AI 영상 생성 도구에 넣을 프롬프트를 자동으로 작성해 줍니다.
메인 프롬프트, 네거티브 프롬프트, 스타일 디스크립터까지 함께 나옵니다.

---

### `engine render` — 렌더 계획서 생성

```bash
npm run engine -- render <파일명.json>
```

실제 렌더링을 하지는 않지만, 어떤 순서로 어떻게 렌더링할지에 대한 계획서를 만들어 줍니다.
구간별 모션·B-roll 배치, 에셋 목록, QA 체크리스트까지 포함됩니다.

---

### `engine publish` — 업로드 계획서 생성

```bash
npm run engine -- publish <파일명.json>
```

제목, 설명, 해시태그, CTA(클릭 유도 문구)를 주제에 맞게 자동 생성합니다.
실제로 업로드하지는 않고, 업로드할 때 사용할 메타데이터를 미리 준비해 주는 명령어입니다.

---

### `engine create` — 프로필 기반 템플릿 생성

```bash
npm run engine -- create <프로필명> <파일명.json>
```

내장 프로필로부터 요청 파일 초안을 자동으로 만들어 줍니다.
`engine config`로 프로필 목록을 먼저 확인하세요.

---

### `engine config` — 프로필 목록 확인

```bash
npm run engine -- config
npm run engine -- config --json
```

사용 가능한 내장 프로필 목록을 보여줍니다.

---

### `engine doctor` — 시스템 진단

```bash
npm run engine -- doctor
npm run engine -- doctor --json
```

현재 개발 환경이 정상인지 점검합니다.
테스트 픽스처 파일들이 있는지, 명령어 카탈로그가 올바른지 확인합니다.
뭔가 이상할 때 가장 먼저 실행해 보면 좋습니다.

---

### `engine execute` — 영상 생성 (API 연결 필요)

```bash
# 실제 API 호출 (API 키 필요)
npm run engine -- execute <파일명.json>

# API 없이 시뮬레이션만 (API 키 불필요)
npm run engine -- execute <파일명.json> --dry-run
```

Sora · Runway · Kling AI에 실제로 영상 생성을 요청합니다.
`--dry-run` 옵션을 사용하면 API 키 없이도 어떻게 동작하는지 시뮬레이션해 볼 수 있어요.

---

### `engine tts` — 음성 합성 (API 연결 필요)

```bash
npm run engine -- tts <파일명.json>
npm run engine -- tts <파일명.json> --dry-run
```

ElevenLabs · OpenAI · Google TTS로 나레이션 음성을 합성합니다.
나레이션 대본은 요청 파일의 `topic`, `goal`, `emotion`을 조합해 자동으로 만들어집니다.

---

### `engine upload` — 플랫폼 업로드 (API 연결 필요)

```bash
npm run engine -- upload <파일명.json> <영상파일.mp4>
npm run engine -- upload <파일명.json> <영상파일.mp4> --dry-run
```

YouTube · TikTok · Instagram에 영상을 실제로 업로드합니다.
제목, 설명, 해시태그는 자동으로 생성되어 함께 올라갑니다.

---

## 7. 요청 파일 옵션 설명서

요청 파일의 각 항목이 무엇을 의미하는지 하나씩 설명합니다.

```json
{
  "version": "0.1",
  "intent": {
    "topic": "AI 회의록 자동 정리 도구",
    "subject": "직장인",
    "goal": "도구 사용법 알리기",
    "emotion": "놀라움",
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

### `intent` — 영상의 목적

| 항목 | 설명 | 예시 |
|------|------|------|
| `topic` | 영상 주제 | `"AI로 회의록 정리하는 법"` |
| `subject` | 등장 인물 또는 대상 | `"직장인"`, `"스마트폰"` |
| `goal` | 영상의 목적 | `"도구 사용법 알리기"`, `"구독 유도"` |
| `emotion` | 전달하고 싶은 감정 | `"놀라움"`, `"공감"`, `"흥미"` |
| `platform` | 업로드할 플랫폼 | 아래 표 참고 |
| `theme` | 콘텐츠 유형 | `"explainer"`, `"tutorial"`, `"story"` |
| `duration_sec` | 원하는 영상 길이 (초) | `30` |

**platform 선택지:**

| 값 | 플랫폼 | 권장 길이 | 특징 |
|----|--------|---------|------|
| `youtube_shorts` | 유튜브 쇼츠 | 30초 | 검색 최적화, 훅 명확성 중요 |
| `tiktok` | 틱톡 | 20초 | 빠른 모션, 즉각적 자막 중요 |
| `instagram_reels` | 인스타그램 릴스 | 20초 | 시각적 일관성, 브랜드 완성도 중요 |

> `duration_sec`이 플랫폼 허용 범위를 벗어나면 엔진이 자동으로 보정하고 경고를 남깁니다. 걱정하지 않아도 됩니다.

---

### `constraints` — 제작 조건

**`budget_tier` — 예산 등급**

| 값 | 설명 | 추천 상황 |
|----|------|----------|
| `low` | 로컬 처리. API 비용 없음 | 테스트, 초안 제작 |
| `balanced` | 비용과 품질의 균형 | 일반적인 콘텐츠 |
| `high` | 프리미엄 API 사용 허용 | 중요한 영상, 최고 품질 필요 시 |

**`quality_tier` — 품질 등급**

| 값 | 설명 |
|----|------|
| `low` | 빠른 초안. 속도 우선 |
| `balanced` | 일반적인 품질 |
| `premium` | 최고 품질. 시간과 비용 더 투자 |

---

### `style` — 영상 스타일

**`hook_type` — 영상 첫 3초 유형**

| 값 | 설명 | 예시 |
|----|------|------|
| `curiosity` | 궁금증 유발 | "이거 알고 있었나요?" |
| `surprise` | 충격·반전 | "믿기 힘들겠지만..." |
| `cliffhanger` | 긴장감 조성 | "결말은 상상도 못할 거예요" |
| `question` | 직접 질문 | "혹시 이런 경험 있으신가요?" |

**`pacing_profile` — 편집 속도**

| 값 | 설명 |
|----|------|
| `fast_cut` | 빠른 컷 전환. 틱톡 스타일 |
| `slow_burn` | 천천히 쌓아가는 방식 |
| `dramatic_build` | 극적인 긴장감 고조 |

---

### `backend` — 처리 방식

**`preferred_engine` — 선호 영상 생성 엔진**

| 값 | 설명 | 비용 |
|----|------|------|
| `local` | 로컬 처리 (API 없음) | 무료 |
| `gpu` | GPU 배치 처리 | 중간 |
| `sora` | OpenAI Sora | 고가 |
| `premium` | 최고급 엔진 | 최고가 |

**`allow_fallback`** — `true`로 설정하면 선호 엔진이 실패했을 때 자동으로 대안 엔진으로 전환합니다.

---

### `novel` — 소설 변환 (선택 항목)

소설 에피소드를 숏츠로 변환할 때 추가합니다.

```json
{
  "novel": {
    "mode": "cliffhanger_short",
    "episode_text": "소설 에피소드 내용을 여기에 붙여넣으세요..."
  }
}
```

**mode 종류:**

| 값 | 설명 |
|----|------|
| `cliffhanger_short` | 극적 긴장감·미완결로 다음 편 기대감 유발 |
| `character_moment_short` | 캐릭터 감정이나 성장 순간에 집중 |
| `lore_worldbuilding_short` | 세계관이나 배경 지식 소개 |

---

## 8. 출력 결과 읽는 법

`engine run`을 실행하면 많은 정보가 나옵니다. 처음엔 복잡해 보이지만 구조를 알면 쉽습니다.

`--json` 플래그를 쓰면 아래 구조로 나옵니다:

```json
{
  "request_id": "req_abc123",
  "validation": { "valid": true, "errors": [] },
  "platform_output_spec": {
    "platform": "youtube_shorts",
    "effective_duration_sec": 30,
    "warnings": []
  },
  "motion_plan": { "segments": [...] },
  "broll_plan": { "segments": [...] },
  "learning_state": {
    "phase": "bootstrapped",
    "weights": { "dataset": 0.8, "user": 0.2 }
  },
  "scoring": { "candidate_score": 0.72 },
  "routing": {
    "selected_backend": "local",
    "reason_codes": ["local_backend_available"]
  },
  "execution_plan": { "nodes": [...], "edges": [...] },
  "recovery_simulation": { "normal_path": [...], "recovery_paths": [...] }
}
```

각 항목을 쉽게 설명하면:

**`validation`** — 요청 파일이 올바른지 확인한 결과입니다.
`"valid": true`면 OK, `"errors"`에 뭔가 있으면 그 부분을 고쳐야 합니다.

**`platform_output_spec`** — 플랫폼 규격 적용 결과입니다.
`effective_duration_sec`는 최종 확정된 영상 길이입니다. 내가 입력한 값과 다를 수 있어요 — 플랫폼 범위를 벗어나면 자동으로 맞춰줍니다.
`warnings`에 내용이 있으면 자동 조정이 일어났다는 뜻입니다.

**`motion_plan`** — 구간별 카메라 움직임 계획입니다.
hook(첫 장면), body_1, body_2, closer(마지막) 구간에 어떤 카메라 동작을 쓸지 나옵니다.

**`broll_plan`** — 구간별 보조 영상 클립 추천입니다.
"성장"이라는 주제면 식물·계단·그래프 같은 시각적 은유가 추천됩니다.

**`learning_state`** — 현재 개인화 단계입니다.
처음엔 `bootstrapped`(데이터셋 위주)로 시작해서, 사용할수록 `adaptive` → `personalized`로 발전합니다.

**`scoring`** — 이 요청의 점수입니다.
`candidate_score`가 높을수록 더 좋은 조건입니다. 0.6 미만이면 프리미엄 엔진 사용이 제한됩니다.

**`routing`** — 어떤 처리 방식을 선택했는지, 왜 선택했는지 보여줍니다.

**`execution_plan`** — 실제 처리 순서 계획입니다. 각 단계에 실패 시 어떤 대안 경로를 쓸지도 포함됩니다.

**`recovery_simulation`** — 오류가 났을 때 어떻게 복구할지 미리 시뮬레이션한 결과입니다.

---

## 9. API 연결하기 (영상·음성·업로드)

**API 키 없이도 엔진의 기획 기능은 100% 사용 가능합니다.**
API는 실제 영상 생성·음성 합성·플랫폼 업로드가 필요할 때만 설정하면 됩니다.

### 환경 변수 파일 만들기

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

`.env` 파일을 텍스트 편집기로 열고, 사용하려는 서비스의 키를 입력합니다.

```
# 아래 중 사용하려는 것만 입력하면 됩니다
SORA_API_KEY=여기에_입력
RUNWAY_API_KEY=여기에_입력
ELEVENLABS_API_KEY=여기에_입력
YOUTUBE_CLIENT_ID=여기에_입력
YOUTUBE_REFRESH_TOKEN=여기에_입력
```

> `.env` 파일은 절대 GitHub에 올리면 안 됩니다. 이미 `.gitignore`에 포함되어 있으니 실수로 올라갈 일은 없지만, 한 번 더 확인하는 습관을 가지세요.

---

### 영상 생성 API

| 서비스 | 환경변수 | 발급 |
|--------|----------|------|
| OpenAI Sora | `SORA_API_KEY` | https://openai.com/sora |
| Runway Gen-3 | `RUNWAY_API_KEY` | https://runwayml.com |
| Kling AI | `KLING_API_KEY` | https://klingai.com |

```bash
# 실제 API 호출 (키 입력 후)
npm run engine -- execute my-video.json

# 키 없이 시뮬레이션만
npm run engine -- execute my-video.json --dry-run
```

---

### 음성 합성(TTS) API

나레이션 대본은 `topic`, `goal`, `emotion`을 조합해 자동 생성됩니다.

| 서비스 | 환경변수 | 발급 |
|--------|----------|------|
| ElevenLabs | `ELEVENLABS_API_KEY` | https://elevenlabs.io |
| OpenAI TTS | `OPENAI_API_KEY` | https://platform.openai.com |
| Google TTS | `GOOGLE_TTS_API_KEY` | https://cloud.google.com/text-to-speech |

```bash
npm run engine -- tts my-video.json
npm run engine -- tts my-video.json --dry-run
```

---

### 플랫폼 업로드 API

| 서비스 | 환경변수 | 발급 |
|--------|----------|------|
| YouTube | `YOUTUBE_CLIENT_ID` + `YOUTUBE_REFRESH_TOKEN` | https://developers.google.com/youtube/v3 |
| TikTok | `TIKTOK_ACCESS_TOKEN` | https://developers.tiktok.com |
| Instagram | `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_ACCOUNT_ID` | https://developers.facebook.com/docs/instagram-api |

```bash
npm run engine -- upload my-video.json output.mp4
npm run engine -- upload my-video.json output.mp4 --dry-run
```

---

## 10. 전체 제작 파이프라인

기획부터 업로드까지 전 과정을 이어서 실행하는 방법입니다.

```
① wizard   → 요청 파일 만들기 (처음 한 번)
      ↓
② run      → 전체 기획 계획 확인
      ↓
③ analyze  → 준비도 점수 확인 (생략 가능)
      ↓
④ prompt   → AI 영상 생성 프롬프트 확인 (생략 가능)
      ↓
⑤ execute  → 실제 영상 생성 (API 키 필요)
      ↓
⑥ tts      → 나레이션 음성 합성 (API 키 필요)
      ↓
⑦ upload   → 플랫폼 업로드 (API 토큰 필요)
```

처음엔 ①~②번만 해 보면서 엔진이 어떤 계획을 세우는지 이해하는 것을 추천합니다.
API 키를 준비한 뒤 ⑤~⑦번으로 실제 제작까지 이어가면 됩니다.

**실제 예시 전체 흐름:**

```bash
# ① 요청 파일 만들기
npm run engine -- wizard my-video.json

# ② 기획 계획 전체 확인
npm run engine -- run my-video.json

# ③ 준비도 빠르게 확인
npm run engine -- analyze my-video.json

# ④ AI 프롬프트 확인
npm run engine -- prompt my-video.json

# ⑤ 영상 생성 (키 없으면 dry-run으로)
npm run engine -- execute my-video.json --dry-run

# ⑥ 음성 합성
npm run engine -- tts my-video.json --dry-run

# ⑦ 업로드
npm run engine -- upload my-video.json output.mp4 --dry-run
```

---

## 11. 플랫폼별 영상 규격

각 플랫폼마다 허용되는 영상 길이가 다릅니다.
요청 파일에서 범위를 벗어난 값을 입력해도 엔진이 자동으로 맞춰주니 걱정하지 않아도 됩니다.

| 플랫폼 | 권장 길이 | 최소 | 최대 | 이런 영상이 잘 됩니다 |
|--------|---------|------|------|---------------------|
| 유튜브 쇼츠 | **30초** | 15초 | 60초 | 훅이 명확하고, 검색 키워드가 들어간 영상 |
| 틱톡 | **20초** | 10초 | 45초 | 빠른 편집, 즉각적인 자막, 높은 에너지 |
| 인스타그램 릴스 | **20초** | 10초 | 45초 | 시각적으로 일관성 있고 브랜드가 느껴지는 영상 |

---

## 12. 비용 자동 절감 규칙

엔진은 5가지 규칙으로 가장 경제적인 처리 방식을 자동으로 선택합니다.
비용이 얼마나 들지 걱정되신다면 이 규칙들이 지켜주고 있다는 걸 알아두세요.

| 규칙 | 언제 적용되나요 | 어떻게 절약하나요 |
|------|---------------|----------------|
| **Rule A** | 후보 점수가 0.6 미만일 때 | 프리미엄 엔진 사용을 차단합니다 |
| **Rule B** | 같은 요청을 이전에 처리한 기록이 있을 때 | 재처리 없이 캐시 결과를 즉시 반환합니다 |
| **Rule C** | 5개 이상 배치 + GPU 사용 가능할 때 | GPU 처리로 단가를 낮춥니다 |
| **Rule D** | 프리미엄 엔진 사용 여부 결정 시 | 최종 고가치 단계에만 허용합니다 |
| **Rule E** | 재시도를 할지 결정해야 할 때 | 재시도 비용이 이득보다 크면 바로 폴백으로 전환합니다 |

---

## 13. 테스트 실행하기

```bash
npm test
```

120개 테스트가 전부 통과하면 코드 상태가 완벽합니다.

> 설치 직후에도 꼭 한 번 실행해 보세요. "아, 제대로 설치됐구나" 확인하는 좋은 방법입니다.

특정 부분만 테스트하고 싶다면 빌드 후 직접 지정할 수 있습니다:

```bash
npm run build
node --test "dist/tests/domain/*.test.js"
```

---

## 14. 막혔을 때 (FAQ)

### Q: `node --version`을 쳤는데 버전이 낮게 나와요

Node.js를 다시 설치해야 합니다. https://nodejs.org 에서 LTS 버전을 받아 설치하세요.
이미 설치돼 있어도 오래된 버전이면 새로 설치하면 덮어써집니다.

### Q: `npm install`에서 에러가 났어요

가장 흔한 원인은 Node.js 버전이 낮은 경우입니다.
`node --version`으로 v24 이상인지 먼저 확인하세요.

버전이 맞는데도 에러가 난다면:
```bash
# node_modules 삭제 후 다시 설치
rm -rf node_modules
npm install
```

### Q: API 키 없이도 쓸 수 있나요?

네, 완전히 사용 가능합니다.
`engine run`, `engine analyze`, `engine prompt`, `engine render`, `engine publish`, `engine wizard` — 이 명령어들은 API 키 없이 100% 동작합니다.

`engine execute`, `engine tts`, `engine upload`는 API 키가 있어야 실제 작업이 되지만, `--dry-run` 옵션으로 시뮬레이션은 언제든 해볼 수 있습니다.

### Q: 학습 상태(learning_state)가 계속 `bootstrapped`로 나와요

처음엔 원래 그렇습니다. 사용 횟수에 따라 단계가 올라갑니다.

| 단계 | 조건 | 데이터셋 vs 내 취향 비율 |
|------|------|----------------------|
| bootstrapped | 0~9회 | 80% : 20% |
| adaptive | 10~49회 | 50% : 50% |
| personalized | 50회 이상 | 20% : 80% |

### Q: `duration_sec`을 60으로 했는데 출력에서 달라졌어요

플랫폼 허용 범위를 벗어나면 자동으로 보정됩니다.
예를 들어 틱톡에 60초를 요청하면 45초로 줄어들고 `warnings`에 기록됩니다.
이건 버그가 아니라 의도된 동작입니다.

### Q: JSON 출력을 파일로 저장하려면요?

리다이렉션(`>`)을 사용하면 됩니다:

```bash
npm run engine -- run my-video.json --json > plan.json
```

### Q: `engine doctor`는 언제 쓰나요?

뭔가 이상하다 싶을 때 가장 먼저 실행해 보세요.
환경 설정, 테스트 파일, 명령어 카탈로그가 모두 정상인지 한번에 확인해 줍니다.

```bash
npm run engine -- doctor
```

---

## 15. 프로젝트 구조 이해하기

내부가 어떻게 생겼는지 궁금하신 분들을 위한 설명입니다.

```
src/
  cli/          사용자 명령을 받아 처리하는 레이어. 비즈니스 로직은 없음
  domain/       핵심 결정 로직. 검증·정규화·점수계산·비용라우팅
  platform/     플랫폼별 규격 (유튜브·틱톡·릴스)
  motion/       카메라 모션 패턴과 반복 방지 규칙
  broll/        B-roll 시맨틱 매핑 (30개 핵심 개념)
  learning/     3단계 개인화 모델
  novel/        소설→숏폼 변환 파이프라인
  prompt/       AI 프롬프트 생성
  render/       렌더 계획 생성
  publish/      업로드 메타데이터 생성
  analyze/      분석 리포트 생성
  simulation/   실행 계획 DAG 및 오류 복구 시뮬레이션
  config/       내장 프로필 카탈로그
  create/       프로필 기반 요청 파일 생성
  doctor/       시스템 진단
  shared/       공통 유틸리티
  adapters/
    video/      영상 생성 어댑터 (local / sora / runway / kling)
    tts/        음성 합성 어댑터 (local / elevenlabs / openai / google)
    upload/     업로드 어댑터 (local / youtube / tiktok / instagram)
  execute/      어댑터 실행 오케스트레이터
tests/
  fixtures/     테스트용 샘플 요청 파일 10개
```

더 자세한 내부 구조는 [docs/architecture.md](./docs/architecture.md)를 참고하세요.

---

## 16. 기여하기

버그를 발견하거나 새 기능 아이디어가 있으면 언제든 환영합니다.

1. 이 저장소를 Fork합니다.
2. 새 브랜치를 만듭니다: `git checkout -b feature/내가-추가할-기능`
3. 코드를 수정하고 테스트를 실행합니다: `npm test`
4. Pull Request를 보냅니다.

버그 신고나 기능 제안은 [GitHub Issues](https://github.com/sinmb79/Shorts-engine/issues)에 남겨주세요.

---

## 라이선스

MIT License — 자유롭게 사용, 수정, 배포할 수 있습니다.
