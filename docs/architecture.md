# Shorts Engine 아키텍처

이 문서는 Shorts Engine의 내부 구조, 처리 흐름, 각 모듈의 역할을 설명합니다.

---

## 설계 원칙

이 엔진은 아래 원칙을 기반으로 설계되었습니다.

| 원칙 | 내용 |
|------|------|
| **결정론적(Deterministic)** | 동일 입력에 항상 동일 출력. 재현 가능한 계획 |
| **구조화된 데이터** | 모든 입출력은 타입이 명시된 계약(Contract) |
| **시뮬레이션 우선** | 실제 API 호출 전에 계획 먼저 수립 |
| **비용 인식** | 5가지 규칙으로 최적 백엔드 자동 선택 |
| **모듈 단일 책임** | 각 모듈은 하나의 역할만 담당 |
| **오류 복구 설계** | 각 노드에 재시도·폴백·스킵 정책 내장 |

---

## 메인 파이프라인 (13단계)

모든 명령어는 아래 공통 파이프라인을 거칩니다.

```
1.  load                      요청 파일 JSON 로드
2.  validate                  스키마 검증
3.  normalize                 입력 정규화 (공백 제거, 기본값 적용)
4.  resolve_novel_shorts_plan 소설→숏츠 계획 (novel 키 있을 때만)
5.  resolve_platform_output_spec  플랫폼별 영상 규격 결정
6.  resolve_motion_plan       카메라 모션 패턴 계획
7.  resolve_broll_plan        B-roll 시맨틱 매핑
8.  resolve_learning_state    학습 단계 및 개인화 가중치 결정
9.  score                     4개 점수 계산
10. route                     비용 라우팅 (5가지 규칙)
11. build_execution_plan      실행 DAG 구성
12. simulate_recovery         오류 복구 경로 시뮬레이션
13. render_output             출력 렌더링 (plain text 또는 JSON)
```

명령어별로 공통 파이프라인 이후 추가 단계가 붙습니다.

```
run     → (13단계 완료)
prompt  → 13단계 + build_prompt_result → render_prompt_output
analyze → 13단계 + build_analysis_report → render_analysis_output
render  → 13단계 + build_prompt_result → build_render_plan → render_render_plan_output
publish → 13단계 + build_prompt_result → build_render_plan → build_publish_plan → render_publish_output
```

---

## 모듈 구조

### `src/cli` — CLI 레이어

CLI 레이어는 사용자 명령을 받아 실행하고 결과를 출력합니다.

**담당:**
- 명령어 파싱
- 요청 파일 로드
- 결과 렌더링 (plain text / JSON)
- 프로세스 종료 코드 결정

**담당하지 않는 것:** 비즈니스 로직 (비즈니스 로직은 domain과 각 전문 모듈에 위치)

`resolve_planning_context` 헬퍼를 통해 `run`, `prompt`, `render`, `publish`, `analyze` 명령이 동일한 파이프라인을 중복 없이 공유합니다.

**종료 코드:**

| 코드 | 의미 |
|------|------|
| `0` | 성공 |
| `1` | 내부 오류 |
| `2` | 검증 오류 |
| `3` | 파일 I/O 오류 |

---

### `src/domain` — 핵심 비즈니스 로직

엔진의 핵심 결정 로직이 모두 여기에 있습니다.

**담당:**
- `EngineRequest` 스키마 검증
- 입력 정규화 (`NormalizedRequest` 생성)
- 4개 점수 계산 (scoring)
- 비용 라우팅 결정 (5가지 규칙)
- 에러 계약 정의

**점수 계산:**

```
candidate_score          = 전반적 비용 효율성 (0.0~1.0)
quality_tier_score       = 품질 지표 (0.0~1.0)
premium_eligibility_score = 프리미엄 API 적격성 (0.0~1.0)
cost_risk_score          = 비용 불확실성 (0.0~1.0)
```

---

### `src/config` — 프로필 카탈로그

**담당:**
- 내장 요청 프로필 카탈로그
- 기본 프로필 선택
- 명령어 카탈로그 메타데이터

`create` 명령과 `config` 명령이 이 모듈을 사용합니다. 별도의 로컬 파일 저장 없이 동작합니다.

---

### `src/create` — 요청 파일 템플릿 생성

**담당:**
- 프로필 기반 요청 파일 스캐폴드 생성
- 프로필 → 요청 파일 변환

초보자가 `engine create <프로필>` 명령으로 시작할 수 있게 합니다.

---

### `src/platform` — 플랫폼 출력 스펙

**담당:**
- 플랫폼별 영상 규격 테이블
- `duration_sec` 자동 보정 (범위 초과 시)
- 경고 및 보정 기록 생성
- 플랫폼 전달 메타데이터

요청 정규화와 분리되어 있어 출력 정책을 독립적으로 관리합니다.

**플랫폼 규격:**

| 플랫폼 | 최소 | 최대 | 권장 | FPS | 비율 |
|--------|------|------|-----|-----|------|
| youtube_shorts | 15s | 60s | 30s | 30 | 9:16 |
| tiktok | 10s | 45s | 20s | 30 | 9:16 |
| instagram_reels | 10s | 45s | 20s | 30 | 9:16 |

---

### `src/motion` — 카메라 모션 플래닝

**담당:**
- 모션 메타데이터 테이블 (7가지 모션 유형)
- 구간(hook, body_1, body_2, closer)별 모션 할당
- 반복 방지 규칙 적용

**7가지 모션 유형:**
`zoom_in` · `zoom_out` · `pan_left` · `pan_right` · `parallax` · `rotate_slow` · `glitch_transition`

**반복 방지 규칙:**
- 동일 모션 3회 이상 연속 금지
- 동일 방향 팬 2회 이상 연속 금지
- 5초마다 모션 변화 필요
- 훅(hook) 구간은 강한 모션 필수
- 루프 콘텐츠에서 과도한 글리치 모션 금지

---

### `src/broll` — B-roll 시맨틱 매핑

**담당:**
- 30개 핵심 개념 데이터셋
- 시맨틱 키워드 매칭
- 구간별 개념 선택
- 폴백 개념 선택

**30개 핵심 개념:**
`ai`, `automation`, `time_saving`, `growth`, `money`, `comparison`, `risk`, `free`, `focus`, `speed`, `failure`, `success`, `change`, `choice`, `learning`, `opportunity`, `workflow`, `clarity`, `productivity`, `teamwork`, `innovation`, `security`, `decision`, `planning`, `retention`, `surprise`, `trust`, `simplicity`, `efficiency`, `momentum`

각 개념에는 시각적 은유(3~5개), 무드 태그, 플랫폼 적합도, 키워드 트리거가 포함됩니다.

---

### `src/learning` — 학습 상태 및 개인화

**담당:**
- 학습 히스토리 해석
- 3단계 cold-start 모델 적용
- 가중치·신뢰도·폴백 소스 결정

**3단계 개인화 모델:**

| 단계 | 사용 횟수 | 데이터셋 가중치 | 사용자 가중치 | 신뢰도 |
|------|----------|--------------|------------|--------|
| bootstrapped | 0~9회 | 80% | 20% | low |
| adaptive | 10~49회 | 50% | 50% | medium |
| personalized | 50회+ | 20% | 80% | high |

별도의 영구 저장소 없이 요청 내 히스토리 데이터만으로 결정합니다.

---

### `src/doctor` — 시스템 진단

**담당:**
- 로컬 환경 점검
- 테스트 픽스처 파일 존재 여부 확인
- 명령어 카탈로그 점검
- 전체 진단 상태 결정

네트워크 호출이나 외부 서비스 연결 없이 결정론적으로 동작합니다.

---

### `src/analyze` — 분석 리포트

**담당:**
- 준비도(readiness) 요약
- 위험 점수(risk) 요약
- 경고 집계 및 진단

`run` 명령보다 간결한 한눈에 보는 요청 상태 진단을 제공합니다.

---

### `src/novel` — 소설→숏폼 변환

**담당:**
- 소설 에피소드 해석
- 하이라이트 후보 선정
- 훅 빌더 생성
- 모드별 시나리오 개요 생성
- 의도(intent) 오버라이드

**소설 모드 3가지:**
- `cliffhanger_short` — 극적 긴장감·미완결
- `character_moment_short` — 캐릭터 감정·집중
- `lore_worldbuilding_short` — 세계관 설명

`normalized_request`를 변경하지 않고 별도의 `novel_shorts_plan` 객체를 생성합니다.

---

### `src/prompt` — 프롬프트 생성

**담당:**
- AI 영상 생성용 프롬프트 구성
- 스타일 디스크립터 합성
- 네거티브 프롬프트 생성
- 품질 점수·경고 집계

도메인 로직을 다시 실행하지 않고 계획 컨텍스트에서 바로 생성합니다.

---

### `src/render` — 렌더 계획

**담당:**
- 렌더 매니페스트 생성
- 구간별 모션·B-roll 정렬
- 에셋 매니페스트 구성
- 렌더 QA 체크리스트 생성

실제 미디어를 생성하지 않습니다. 미래 렌더러가 소비할 계획서를 만듭니다.

---

### `src/publish` — 퍼블리시 계획

**담당:**
- 플랫폼 패키징 메타데이터 생성
- 제목·해시태그 자동 생성
- CTA(Call-to-Action) 합성
- 업로드 체크리스트 생성

실제 업로드하지 않습니다. 미래 업로더가 소비할 계획서를 만듭니다.

---

### `src/simulation` — 실행 계획 및 회복 시뮬레이션

**담당:**
- 실행 계획 DAG 구성
- 노드별 재시도·폴백·스킵 정책
- 정상 경로·회복 경로 생성

실제 백엔드 없이 엔진이 어떻게 동작할지를 모델링합니다.

---

### `src/adapters` — 통합 어댑터

실제 외부 서비스와의 연결 레이어입니다.

```
adapters/
  video/
    local-adapter.ts       드라이런·시뮬레이션
    sora-adapter.ts        OpenAI Sora 연동
    runway-adapter.ts      Runway Gen-3 연동
    kling-adapter.ts       Kling AI 연동
    adapter-registry.ts    어댑터 선택·등록
  tts/
    local-tts-adapter.ts   드라이런
    elevenlabs-adapter.ts  ElevenLabs 연동
    openai-tts-adapter.ts  OpenAI TTS 연동
    google-tts-adapter.ts  Google Cloud TTS 연동
    tts-adapter-registry.ts
  upload/
    local-upload-adapter.ts  드라이런
    youtube-upload-adapter.ts  YouTube Data API v3
    tiktok-upload-adapter.ts   TikTok for Developers
    instagram-upload-adapter.ts  Instagram Graph API
    upload-adapter-registry.ts
```

API 키가 없으면 자동으로 local 어댑터를 선택합니다.

---

## 핵심 데이터 계약 (Contract)

### `EngineRequest`

CLI가 받는 외부 JSON 계약. 사용자가 작성하는 요청 파일입니다.

### `NormalizedRequest`

검증 후 사용하는 내부 계약. 두 부분으로 나뉩니다:
- `base`: 정규화된 사용자 입력
- `derived`: 계산된 파생 필드 (aspect_ratio, premium_allowed 등)

이후 모든 단계는 `NormalizedRequest`만 읽습니다.

### `PlatformOutputSpec`

플랫폼 정책 객체. `effective_duration`, `warnings`, `adjustment_records`를 포함합니다. `normalized_request`를 변경하지 않고 별도로 관리됩니다.

### `MotionPlan`

구간별 모션 계획. `segments`, `motion_sequence`, `hook_motion`, `anti_repetition_state`, `warnings`를 포함합니다.

### `BrollPlan`

B-roll 시맨틱 계획. 각 구간에 선택된 개념, 시각적 은유, 무드 태그, 플랫폼 적합도, 선택 이유 코드가 포함됩니다.

### `LearningState`

학습 상태 객체. `phase`, `weights`, `threshold_status`, `confidence`, `fallback_sources`, `reason_codes`를 포함합니다.

### `NovelShortsPlan`

소설 변환 계획. `mode`, `highlight_candidate`, `hook_builder`, `shorts_script_outline`, `qa_flags`, `intent_overrides`를 포함합니다.

### `PromptResult`

AI 프롬프트 아티팩트. `engine`, `main_prompt`, `negative_prompt`, `style_descriptor`, `quality_score`, `warnings`, `params`를 포함합니다.

### `AnalyzeResult`

진단 아티팩트. `request_id`, `readiness`, `risk_summary`, `warning_count`, `recommended_backend`를 포함합니다.

### `RenderPlan`

렌더 매니페스트. `render_id`, `engine`, `output_filename`, `segments`, `asset_manifest`, `qa_checklist`, `warnings`를 포함합니다.

### `PublishPlan`

퍼블리시 매니페스트. `publish_id`, `platform`, `title`, `description`, `hashtags`, `cta`, `upload_checklist`, `warnings`를 포함합니다.

---

## 실행 계획 DAG

실행 계획은 아래 노드와 엣지로 구성된 경량 DAG입니다.

**주요 노드:**
`prompt_normalizer` → `tool_adapter` → `formatter` → `quality_checker` → `tts_candidate` → `video_candidate` → `final_polish`

**폴백 경로 예시:**
```
ElevenLabs TTS → OpenAI TTS → Local TTS → Edge TTS
```

각 노드는 재시도 횟수, 폴백 노드, 스킵 정책, 비용 메타데이터를 가집니다.

---

## 회복 시뮬레이션

`simulate_recovery`는 실제 백엔드 없이 엔진이 어떻게 오류에서 복구할지를 모델링합니다.

출력:
- `normal_path`: 정상 실행 경로
- `recovery_paths`: 각 노드 실패 시 대안 경로

이를 통해 실제 서비스 연결 전에 폴백 동작을 미리 검증할 수 있습니다.
