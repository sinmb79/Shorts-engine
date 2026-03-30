# Shorts Engine 처음 시작 가이드

이 문서는 "처음 받는 사람도 막히지 않게" 설명하는 입문용 안내서입니다.  
선배가 후배에게 알려주듯이, 꼭 필요한 것부터 차근차근 설명하겠습니다.

## 1. 이 프로그램이 뭐예요?

`Shorts Engine`은 숏폼 영상 제작을 바로 "편집"해 주는 프로그램이라기보다,  
"어떤 영상으로 만들지", "어떤 엔진으로 생성할지", "어떤 프롬프트를 쓸지", "업로드 전까지 어떤 계획으로 갈지"를 정리해 주는 도구입니다.

쉽게 말하면:

- 영상 기획서를 자동으로 만들어 주고
- 프롬프트 초안을 만들고
- 비용이 덜 드는 엔진을 고르고
- 자막/렌더/업로드 계획까지 한 번에 정리해 주는 CLI 도구입니다

이번 릴리즈부터는 Windows에서 **Node.js를 따로 설치하지 않아도 `.exe`만으로 실행**할 수 있습니다.

---

## 2. 누가 쓰면 좋나요?

이런 분들에게 잘 맞습니다.

- 유튜브 쇼츠, 틱톡, 릴스용 기획을 빠르게 만들고 싶은 분
- AI 영상 생성 전에 프롬프트와 구조를 먼저 정리하고 싶은 분
- API 비용을 무작정 쓰기보다, 저렴한 경로부터 확인하고 싶은 분
- 매번 같은 형식으로 요청서를 만드는 게 귀찮은 분

---

## 3. 무엇을 다운로드하면 되나요?

GitHub Release에서 아래 파일을 받으면 됩니다.

- `shorts-engine-win-x64.exe`

처음 쓰는 분은 바탕화면이나 `C:\ShortsEngine` 같은 새 폴더를 하나 만들고,  
그 안에 `.exe`를 넣고 시작하는 걸 추천합니다.

예시:

```text
C:\ShortsEngine\shorts-engine-win-x64.exe
```

---

## 4. 첫 실행은 어떻게 하나요?

### 가장 쉬운 시작 방법

1. `shorts-engine-win-x64.exe`가 있는 폴더로 이동합니다.
2. PowerShell 또는 Windows Terminal을 엽니다.
3. 아래 명령을 실행합니다.

```powershell
.\shorts-engine-win-x64.exe init my-request.json
```

이 명령은 대화형 마법사를 시작합니다.  
질문에 답하면 다음 두 가지가 자동으로 준비됩니다.

- `my-request.json` 요청 파일
- `config/` 기본 설정 폴더

즉, 처음 쓰는 사람은 보통 `init`부터 시작하면 됩니다.

---

## 5. 처음 생성되는 파일들은 뭐예요?

`init`를 한 번 실행하면 보통 이런 구조가 생깁니다.

```text
config/
  engine.json
  shorts-config.json
  prompt-styles.json
  user-profile.json
my-request.json
```

각 파일의 역할은 이렇게 이해하시면 됩니다.

### `my-request.json`

이번에 만들고 싶은 영상 한 건의 요청서입니다.

- 주제
- 감정
- 플랫폼
- 길이
- 스타일
- 선호 엔진

같은 "개별 작업 내용"이 들어갑니다.

### `config/engine.json`

엔진 기본값, TTS 설정, 비디오 생성 기본 우선순위 같은 전역 설정입니다.

### `config/shorts-config.json`

숏폼 제작 관련 공통 자산이나 디렉터리 기본값입니다.

### `config/prompt-styles.json`

코너별 프롬프트 스타일과 색감, 톤, 캡션 스타일 같은 규칙입니다.

### `config/user-profile.json`

사용자 기본값과 예산 제한 같은 "내 취향/내 정책" 설정입니다.

---

## 6. 그 다음엔 어떤 명령을 쓰나요?

가장 많이 쓰는 흐름은 아래 순서입니다.

### 1) 요청서 만들기

```powershell
.\shorts-engine-win-x64.exe init my-request.json
```

### 2) 전체 기획 확인하기

```powershell
.\shorts-engine-win-x64.exe run my-request.json --json
```

이 명령은 다음을 한 번에 계산합니다.

- 요청 검증
- 정규화
- 플랫폼 길이 보정
- 모션 플랜
- B-roll 플랜
- 학습 상태
- 비용 라우팅
- 실행 계획

### 3) 프롬프트만 따로 보기

```powershell
.\shorts-engine-win-x64.exe prompt my-request.json --json
```

이 명령은 AI 영상 생성 도구에 넣을 프롬프트 초안을 확인할 때 좋습니다.

### 4) 분석 리포트 보기

```powershell
.\shorts-engine-win-x64.exe analyze my-request.json --json
```

훅 강도, 품질 신호, 전반적인 구성 점검에 도움이 됩니다.

### 5) 통계 보기

```powershell
.\shorts-engine-win-x64.exe stats --json
```

누적 실행 기록 기준으로 엔진 사용, 비용, 평균 점수 등을 확인합니다.

### 6) 대시보드 켜기

```powershell
.\shorts-engine-win-x64.exe dashboard
```

브라우저에서 overview / analytics / cost / settings 기반 화면을 확인할 수 있습니다.

---

## 7. 실제 영상 생성도 바로 되나요?

정확히는 이렇게 이해하시면 됩니다.

### 기본 상태

API 키가 없으면:

- 로컬 또는 dry-run 중심으로 동작합니다
- 실제 외부 생성 호출 대신 계획/시뮬레이션이 중심입니다

### API 키를 넣으면

필요한 환경 변수(API 키)를 준비하면:

- 영상 생성 어댑터
- TTS 어댑터
- 업로드 어댑터

를 실제 호출하는 방향으로 확장할 수 있습니다.

즉, **처음에는 계획 도구로 써도 되고**,  
나중에는 **실행 쪽으로 넓혀 가는 구조**라고 생각하시면 됩니다.

---

## 8. 자주 쓰는 명령만 딱 정리하면?

```powershell
.\shorts-engine-win-x64.exe init my-request.json
.\shorts-engine-win-x64.exe run my-request.json --json
.\shorts-engine-win-x64.exe prompt my-request.json --json
.\shorts-engine-win-x64.exe analyze my-request.json --json
.\shorts-engine-win-x64.exe stats --json
.\shorts-engine-win-x64.exe dashboard
.\shorts-engine-win-x64.exe doctor --json
```

### `doctor`는 언제 쓰나요?

환경 확인용입니다.

```powershell
.\shorts-engine-win-x64.exe doctor --json
```

이 명령으로 아래를 확인할 수 있습니다.

- 명령 목록이 정상인지
- 등록된 비디오/TTS/업로드 어댑터가 무엇인지
- 현재 실행 환경이 문제 없는지

---

## 9. 파일은 어디서 실행하는 게 좋나요?

이건 중요합니다.

`.exe`는 **작업용 폴더 안에서 실행하는 습관**이 좋습니다.

예를 들어:

```text
C:\ShortsEngine\
  shorts-engine-win-x64.exe
  config\
  my-request.json
```

이렇게 두면:

- 설정 파일이 한 곳에 모이고
- 요청 파일도 같은 폴더에 있고
- 나중에 찾기도 쉽습니다

프로젝트별로 폴더를 따로 나누는 것도 좋습니다.

예시:

```text
C:\ShortsProjects\product-launch\
C:\ShortsProjects\novel-teaser\
C:\ShortsProjects\youtube-explainer\
```

---

## 10. 처음 쓰는 분께 추천하는 안전한 사용 순서

처음에는 아래 순서만 기억하셔도 충분합니다.

### Step 1. `doctor`

```powershell
.\shorts-engine-win-x64.exe doctor --json
```

정상 실행 확인

### Step 2. `init`

```powershell
.\shorts-engine-win-x64.exe init my-request.json
```

요청 파일과 기본 설정 생성

### Step 3. `run`

```powershell
.\shorts-engine-win-x64.exe run my-request.json --json
```

전체 기획 결과 확인

### Step 4. `prompt`

```powershell
.\shorts-engine-win-x64.exe prompt my-request.json --json
```

프롬프트 확인

### Step 5. `analyze`

```powershell
.\shorts-engine-win-x64.exe analyze my-request.json --json
```

훅과 품질 점검

이 순서만 따라도 "무엇을 만들지"에 대한 감은 금방 잡힙니다.

---

## 11. 잘 안 될 때는 어디를 보면 되나요?

### 1) 명령이 아예 안 돌아간다

PowerShell에서 현재 폴더 기준으로 실행했는지 확인하세요.

```powershell
.\shorts-engine-win-x64.exe doctor --json
```

`.\`가 빠지면 Windows가 현재 폴더의 실행 파일을 못 찾는 경우가 있습니다.

### 2) 요청 파일 경로가 틀렸다

파일명을 직접 확인하세요.

```powershell
dir
```

그리고 실제 파일명으로 다시 실행합니다.

```powershell
.\shorts-engine-win-x64.exe run my-request.json --json
```

### 3) 설정이 꼬인 것 같다

`config/` 폴더 내용을 다시 확인하거나, 새 폴더에서 `init`부터 다시 시작해 보세요.

### 4) API 없이 먼저 써보고 싶다

그렇게 쓰는 게 맞습니다.  
처음엔 `doctor`, `init`, `run`, `prompt`, `analyze`만으로도 충분히 가치가 있습니다.

---

## 12. 업데이트는 어떻게 하나요?

새 릴리즈가 올라오면 보통 가장 쉬운 방법은:

1. 새 버전의 `.exe`를 다시 다운로드하고
2. 기존 파일을 새 파일로 교체하는 것입니다

설정 파일(`config/`)과 요청 파일(`*.json`)은 보통 작업 폴더에 그대로 두고,  
실행 파일만 교체하면 됩니다.

---

## 13. 마지막으로, 처음 쓰는 분께 드리고 싶은 팁

처음부터 모든 기능을 한 번에 다 쓰려고 하지 마세요.  
이 도구는 아래 3가지만 먼저 익혀도 충분히 쓸 만해집니다.

1. `init`으로 요청서 만들기
2. `run`으로 전체 계획 보기
3. `prompt`와 `analyze`로 품질 다듬기

그다음에:

- `stats`
- `dashboard`
- 실제 API 연동

순서로 넓혀 가면 부담이 훨씬 적습니다.

한 줄로 요약하면 이렇습니다.

> **Shorts Engine은 "영상 하나를 만들기 전에, 생각을 구조화해 주는 엔진"입니다.**

처음엔 계획 도구로 가볍게 쓰고, 익숙해지면 실행 자동화까지 확장해서 쓰면 됩니다.
