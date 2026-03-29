# Shorts Engine

**숏폼 영상 제작 자동화를 위한 오픈소스 기획 엔진입니다.**

유튜브 쇼츠, TikTok, 인스타그램 릴스 등 숏폼 영상의 제작 계획을 자동으로 세워주는 CLI 도구입니다.
실제 영상을 직접 만들지는 않지만, 어떤 영상을 어떻게 만들지에 대한 **전체 제작 계획서**를 JSON 또는 사람이 읽기 쉬운 형태로 출력합니다.

---

## 이 프로젝트가 하는 일

요청 파일(JSON) 하나를 넣으면 아래 항목을 자동으로 계산해 줍니다.

| 항목 | 설명 |
|------|------|
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

### 사용 가능한 모든 명령어

| 명령어 | 설명 |
|--------|------|
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

70개 테스트가 모두 통과하면 정상입니다.

---

## 프로젝트 구조

```
src/
  cli/          명령줄 인터페이스 (명령어 처리)
  domain/       핵심 비즈니스 로직 (검증, 정규화, 라우팅)
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

## 현재 구현되지 않은 기능

이 프로젝트는 **기획·계획 단계**만 시뮬레이션합니다. 아래 기능은 추후 추가 예정입니다.

- 실제 영상 생성 (Sora, Runway, Kling 등 AI 영상 API 연동)
- 실제 TTS (음성 합성) 생성
- 실제 플랫폼 업로드 자동화
- 대화형 설정 마법사 (CLI 인터랙티브 모드)

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
