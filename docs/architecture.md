# Shorts Engine 아키텍처 가이드

이 문서는 Shorts Engine 내부가 어떻게 설계되어 있는지 설명합니다.
처음 코드를 열어보는 분도 "이 파일이 왜 여기 있는지"를 이해할 수 있도록 작성했습니다.

---

## 이 엔진의 핵심 아이디어

이 엔진은 **"계획 먼저, 실행 나중"** 원칙으로 설계되어 있습니다.

AI 영상 생성 API를 바로 호출하기 전에, 먼저 아래 질문들을 자동으로 결정합니다.

- 이 영상, 몇 초짜리로 만들어야 하지?
- 카메라는 어떻게 움직여야 자연스럽지?
- 어떤 보조 클립(B-roll)이 이 주제에 어울리지?
- API 비용을 아끼려면 어떤 처리 방식을 쓰는 게 좋지?
- API가 실패하면 어떤 대안 경로가 있지?

이 결정들을 JSON 계획서로 만든 뒤, 그 계획서를 기반으로 실제 제작이 진행됩니다.

---

## 설계 원칙

코드를 읽을 때 이 원칙들을 기억하면 "왜 이렇게 짰지?"라는 의문이 줄어듭니다.

**결정론적(Deterministic)**
같은 입력을 주면 항상 같은 출력이 나옵니다. 랜덤 요소가 없습니다.
덕분에 재현 가능하고 테스트하기 쉽습니다.

**구조화된 데이터**
모든 입출력은 TypeScript 타입으로 정의된 계약(Contract)입니다.
어느 모듈이든 받는 데이터, 내보내는 데이터의 형태가 명확합니다.

**모듈 단일 책임**
각 모듈은 딱 하나의 역할만 합니다. `motion/`은 모션만, `broll/`은 B-roll만 담당합니다.
한 모듈을 수정해도 다른 모듈에 영향이 없습니다.

**시뮬레이션 우선**
`render/`는 실제로 렌더링하지 않고 계획서만 만들고,
`publish/`는 실제로 업로드하지 않고 메타데이터만 준비합니다.
실제 실행은 `adapters/`가 담당합니다.

**비용 인식**
5가지 규칙으로 불필요한 API 호출을 자동으로 차단합니다.

---

## 메인 파이프라인 — 13단계

모든 명령어(`run`, `prompt`, `analyze`, `render`, `publish`)는 아래 공통 파이프라인을 거칩니다.

```
1.  load
        요청 파일(JSON)을 읽어옵니다.

2.  validate
        입력이 올바른 형식인지 확인합니다.
        예: platform 값이 올바른지, duration_sec이 숫자인지.

3.  normalize
        입력을 표준 형태로 정리합니다.
        앞뒤 공백 제거, 기본값 채우기, 파생 값 계산(aspect_ratio 등).

4.  resolve_novel_shorts_plan
        요청에 novel 키가 있을 때만 실행됩니다.
        소설 에피소드를 숏츠 시나리오로 변환합니다.

5.  resolve_platform_output_spec
        유튜브·틱톡·릴스별 규격을 적용합니다.
        시간이 범위를 벗어나면 자동으로 보정하고 경고를 남깁니다.

6.  resolve_motion_plan
        구간별 카메라 움직임을 결정합니다.
        같은 동작이 반복되지 않도록 규칙도 함께 적용합니다.

7.  resolve_broll_plan
        주제와 감정에 어울리는 보조 영상 클립을 추천합니다.
        30개 핵심 개념 데이터셋을 기반으로 시맨틱 매핑합니다.

8.  resolve_learning_state
        사용 횟수에 따라 개인화 수준을 결정합니다.
        처음엔 공용 데이터셋 위주, 나중엔 사용자 취향 위주로 전환됩니다.

9.  score
        이 요청의 비용 효율성, 품질, 위험도를 점수로 계산합니다.

10. route
        5가지 규칙으로 최적 처리 백엔드를 선택합니다.
        프리미엄 엔진 허용 여부, 폴백 경로도 함께 결정합니다.

11. build_execution_plan
        처리 순서를 DAG(방향 비순환 그래프)로 구성합니다.
        각 단계의 재시도 횟수, 폴백 노드, 비용을 명시합니다.

12. simulate_recovery
        실제 API 없이, 오류가 났을 때 어떻게 복구할지를 미리 계산합니다.

13. render_output
        결과를 사람이 읽기 쉬운 형태 또는 JSON으로 출력합니다.
```

명령어마다 공통 파이프라인 이후에 추가 단계가 붙습니다.

```
run      →  13단계 완료 후 결과 출력
prompt   →  13단계 + AI 프롬프트 생성 → 출력
analyze  →  13단계 + 분석 리포트 생성 → 출력
render   →  13단계 + AI 프롬프트 → 렌더 계획 → 출력
publish  →  13단계 + AI 프롬프트 → 렌더 계획 → 퍼블리시 계획 → 출력
```

공통 파이프라인은 `src/cli/resolve-planning-context.ts` 하나에 모아두었습니다.
덕분에 각 명령어가 같은 로직을 중복 구현하지 않아도 됩니다.

---

## 모듈별 역할 상세 설명

### `src/cli` — 사용자와의 접점

CLI 레이어는 사용자의 명령을 받아 처리하고 결과를 보여주는 역할만 합니다.
비즈니스 로직은 여기에 없습니다. 판단은 domain과 각 전문 모듈이 합니다.

담당하는 일:
- 명령어 파싱 (`engine run`, `engine wizard` 등 구별)
- 요청 파일 읽기
- 결과를 plain text 또는 JSON으로 출력
- 프로세스 종료 코드 결정

**종료 코드 의미:**

| 코드 | 의미 |
|------|------|
| `0` | 정상 완료 |
| `1` | 내부 오류 |
| `2` | 검증 오류 (요청 파일 형식 문제) |
| `3` | 파일 읽기/쓰기 오류 |

---

### `src/domain` — 핵심 결정 로직

이 엔진의 두뇌입니다. 모든 정책 규칙이 여기에 있습니다.

담당하는 일:
- 요청 파일 스키마 검증
- 입력 정규화 (→ `NormalizedRequest` 생성)
- 4가지 점수 계산
- 5가지 비용 라우팅 규칙 적용

**점수 계산 결과:**

```
candidate_score          = 전체적인 비용 효율성 (0.0 ~ 1.0)
quality_tier_score       = 품질 지표 (0.0 ~ 1.0)
premium_eligibility_score = 프리미엄 API를 쓸 자격이 되는지 (0.0 ~ 1.0)
cost_risk_score          = 비용 불확실성 얼마나 큰지 (0.0 ~ 1.0)
```

`candidate_score`가 0.6 미만이면 프리미엄 엔진 사용이 자동으로 차단됩니다(Rule A).

---

### `src/platform` — 플랫폼 영상 규격

각 플랫폼이 요구하는 영상 스펙을 관리합니다.

담당하는 일:
- 유튜브·틱톡·릴스별 최소·최대·권장 시간 관리
- `duration_sec`이 범위를 벗어나면 자동 보정
- 보정 이력을 `warnings`에 기록

`NormalizedRequest`를 수정하지 않고, 별도의 `PlatformOutputSpec` 객체를 새로 만듭니다.
입력 데이터와 출력 규격을 분리해서 관리하는 것이 핵심입니다.

---

### `src/motion` — 카메라 모션 플래닝

카메라가 어떻게 움직일지를 구간별로 결정합니다.

담당하는 일:
- 7가지 모션 유형 관리 (`zoom_in`, `zoom_out`, `pan_left`, `pan_right`, `parallax`, `rotate_slow`, `glitch_transition`)
- 4개 구간(hook, body_1, body_2, closer)에 모션 할당
- 반복 방지 규칙 적용

**반복 방지 규칙 (왜 이 규칙이 필요한가):**

같은 카메라 동작이 반복되면 영상이 단조로워집니다. 이를 막기 위해:
- 같은 모션을 3번 연속 쓸 수 없습니다
- 같은 방향 팬(pan_left, pan_right)을 2번 연속 쓸 수 없습니다
- 5초마다 모션 변화가 있어야 합니다
- 첫 hook 구간은 반드시 강한 모션이어야 합니다

---

### `src/broll` — B-roll 시맨틱 매핑

주제와 감정에 어울리는 보조 영상 클립을 추천합니다.

**왜 "시맨틱"인가:**
단순히 키워드 매칭이 아니라, 개념의 의미를 파악해 시각적 은유를 연결합니다.
예를 들어 "성장"이라는 주제라면 → 식물이 자라는 클립, 계단을 올라가는 클립, 그래프가 올라가는 클립을 추천합니다.

**내장된 30개 핵심 개념:**
`ai`, `automation`, `time_saving`, `growth`, `money`, `comparison`, `risk`, `free`, `focus`, `speed`, `failure`, `success`, `change`, `choice`, `learning`, `opportunity`, `workflow`, `clarity`, `productivity`, `teamwork`, `innovation`, `security`, `decision`, `planning`, `retention`, `surprise`, `trust`, `simplicity`, `efficiency`, `momentum`

각 개념에는 시각적 은유(3~5개), 분위기 태그, 플랫폼 적합도, 키워드 트리거가 포함되어 있습니다.

---

### `src/learning` — 학습 상태 및 개인화

사용할수록 사용자 취향에 맞게 계획이 조정됩니다.

**3단계 cold-start 모델:**

처음엔 공용 데이터셋을 많이 믿고, 사용하다 보면 내 취향을 점점 더 반영합니다.

| 단계 | 언제 | 공용 데이터셋 비중 | 내 취향 비중 |
|------|------|-----------------|------------|
| bootstrapped | 처음 ~ 9번 사용 | 80% | 20% |
| adaptive | 10 ~ 49번 사용 | 50% | 50% |
| personalized | 50번 이상 사용 | 20% | 80% |

별도의 데이터베이스 없이 요청 파일 안에 있는 히스토리 정보만으로 계산합니다.

---

### `src/novel` — 소설→숏폼 변환

소설 에피소드를 숏폼 영상 시나리오로 변환합니다.

담당하는 일:
- 에피소드에서 하이라이트 장면 선정
- 훅 문구 자동 생성
- 모드에 맞는 시나리오 개요 생성
- 감정 피크와 긴장감 강도 계산

**3가지 변환 모드:**

`cliffhanger_short` — 가장 긴장감 있는 순간에서 끊어서 다음 편이 보고 싶게 만드는 방식

`character_moment_short` — 캐릭터의 감정 변화나 성장 순간을 집중 조명하는 방식

`lore_worldbuilding_short` — 세계관이나 배경 설정을 흥미롭게 소개하는 방식

`NormalizedRequest`를 변경하지 않고 별도의 `NovelShortsPlan` 객체를 만들어 전달합니다.

---

### `src/prompt` — AI 프롬프트 생성

Sora·Runway·Kling 같은 AI 영상 생성 도구에 넣을 프롬프트를 만듭니다.

출력 결과:
- `main_prompt`: 영상 생성에 넣을 핵심 프롬프트
- `negative_prompt`: 피하고 싶은 요소 목록
- `style_descriptor`: 스타일 설명 문구
- `quality_score`: 이 프롬프트의 품질 예상 점수
- `params`: 화면 비율, 길이 등 기술 파라미터

---

### `src/render` — 렌더 계획 생성

실제로 렌더링하지는 않습니다. 어떻게 렌더링할지 계획서를 만듭니다.

출력 결과:
- 구간별 모션·B-roll 정렬 순서
- 필요한 에셋 목록(asset_manifest)
- 렌더링 전 체크해야 할 QA 항목

---

### `src/publish` — 퍼블리시 계획 생성

실제로 업로드하지는 않습니다. 업로드할 때 필요한 메타데이터를 준비합니다.

출력 결과:
- 플랫폼별 최적화된 제목
- 설명 문구
- 해시태그 목록
- CTA(Call-to-Action) 문구
- 업로드 전 체크리스트

---

### `src/simulation` — 실행 계획 및 오류 복구

**실행 계획(DAG)**
처리 순서를 방향 비순환 그래프로 구성합니다.
각 노드(처리 단계)는 재시도 횟수, 폴백 노드, 스킵 정책, 비용 정보를 가집니다.

**오류 복구 시뮬레이션**
실제 API 없이, "만약 이 단계에서 실패한다면 어떤 경로로 복구할까?"를 미리 계산합니다.

예시 폴백 경로:
```
ElevenLabs TTS 실패
    → OpenAI TTS 시도
        → 로컬 TTS 시도
            → Edge TTS 시도
```

---

### `src/adapters` — 외부 서비스 연결

실제 API와 연결되는 레이어입니다.
API 키가 없으면 자동으로 `local` 어댑터를 선택합니다.

```
adapters/
  video/
    local-adapter.ts      드라이런 (API 없이 시뮬레이션)
    sora-adapter.ts       OpenAI Sora 연결
    runway-adapter.ts     Runway Gen-3 연결
    kling-adapter.ts      Kling AI 연결
    adapter-registry.ts   상황에 맞는 어댑터 자동 선택

  tts/
    local-tts-adapter.ts  드라이런
    elevenlabs-adapter.ts ElevenLabs 연결
    openai-tts-adapter.ts OpenAI TTS 연결
    google-tts-adapter.ts Google Cloud TTS 연결
    tts-adapter-registry.ts

  upload/
    local-upload-adapter.ts  드라이런
    youtube-upload-adapter.ts  YouTube Data API v3
    tiktok-upload-adapter.ts   TikTok for Developers API
    instagram-upload-adapter.ts  Instagram Graph API
    upload-adapter-registry.ts
```

---

## 핵심 데이터 계약(Contract) 흐름

데이터가 파이프라인을 거치면서 어떻게 변환되는지 보여줍니다.

```
사용자 작성
EngineRequest (요청 파일 JSON)
        ↓ validate + normalize
NormalizedRequest
  ├── base (정규화된 입력값)
  └── derived (계산된 파생값: aspect_ratio, premium_allowed 등)
        ↓
PlatformOutputSpec (플랫폼 규격 적용 결과)
        ↓
MotionPlan (카메라 모션 계획)
        ↓
BrollPlan (B-roll 추천 목록)
        ↓
LearningState (개인화 단계)
        ↓
ScoreResult (4가지 점수)
        ↓
RoutingDecision (선택된 백엔드 + 이유)
        ↓
ExecutionPlan (처리 DAG)
        ↓
RecoverySimulation (오류 복구 경로)
        ↓
명령어별 추가 처리
  ├── PromptResult (AI 프롬프트)
  ├── RenderPlan (렌더 계획서)
  ├── PublishPlan (퍼블리시 계획서)
  └── AnalyzeResult (분석 리포트)
```

각 단계는 이전 단계의 출력을 읽고, 새로운 객체를 만들어 다음 단계로 넘깁니다.
원본 데이터를 직접 수정하지 않습니다.

---

## 비용 라우팅 규칙 상세

5가지 규칙이 순서대로 적용됩니다.

**Rule A — 점수 기반 프리미엄 차단**
`candidate_score < 0.60`이면 프리미엄 엔진을 사용하지 않습니다.
점수가 낮다는 건 이 요청이 프리미엄 처리를 정당화할 만큼 가치 있지 않다는 의미입니다.

**Rule B — 캐시 우선 (항상 최우선)**
같은 요청을 이전에 처리한 기록이 있으면 재처리 없이 즉시 반환합니다.
가장 빠르고 가장 저렴한 방법입니다.

**Rule C — 배치 GPU 처리**
`batch_size >= 5`이고 GPU를 쓸 수 있으면 GPU 처리를 우선합니다.
여러 영상을 한꺼번에 처리할 때 단가를 낮추는 방법입니다.

**Rule D — 프리미엄은 최종 단계만**
프리미엄 엔진은 최종 고품질 출력 단계에만 허용합니다.
중간 처리 단계에서는 쓰지 않습니다.

**Rule E — 재시도 비용 대비 이득 계산**
재시도에 드는 비용이 얻을 수 있는 이득보다 크면, 재시도 없이 폴백으로 바로 전환합니다.

---

## 테스트 구조

```
tests/
  fixtures/     실제 요청 파일 예시 10개 (다양한 시나리오)
  helpers/      테스트용 공통 유틸리티
  bootstrap/    초기화 테스트
  domain/       검증·정규화·점수계산·라우팅 테스트
  platform/     플랫폼 규격 테스트
  motion/       모션 플래닝 테스트
  broll/        B-roll 매핑 테스트
  learning/     학습 상태 테스트
  novel/        소설 변환 테스트
  simulation/   실행 계획 테스트
  prompt/       프롬프트 생성 테스트
  render/       렌더 계획 테스트
  publish/      퍼블리시 계획 테스트
  cli/          CLI 명령어 테스트
  adapters/     어댑터 초기화 테스트
```

총 120개 테스트. Node.js 내장 테스트 러너를 사용합니다.
