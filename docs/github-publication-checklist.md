# GitHub 공개 배포 체크리스트

이 저장소를 공개 GitHub 저장소에 푸시하기 전에 아래 절차를 따르세요.

---

## 공개해야 할 파일

| 경로 | 설명 |
|------|------|
| `src/` | 전체 소스 코드 |
| `tests/` | 테스트 코드 및 픽스처 |
| `docs/` | 아키텍처 문서, 체크리스트 |
| `package.json` | 프로젝트 메타데이터 |
| `package-lock.json` | 의존성 잠금 파일 |
| `tsconfig.json` | TypeScript 컴파일러 설정 |
| `.gitignore` | Git 제외 설정 |
| `.env.example` | 환경변수 예시 (실제 값 없는 것) |
| `README.md` | 프로젝트 문서 |
| `shorts_engine_masterplan_v21.md` | 설계 명세서 |

---

## 절대 공개하면 안 되는 파일

| 파일 / 경로 | 이유 |
|------------|------|
| `.env` | API 키, 토큰, 시크릿 포함 |
| `.env.*` | 모든 환경별 env 파일 |
| `node_modules/` | 빌드 산출물 (용량만 차지) |
| `dist/` | 컴파일 결과물 |
| `*.log` | 런타임 로그 |
| IDE 캐시 (`.idea/`, `.vscode/` 등) | 개인 설정 |
| 개인 메모·임시 내보내기 파일 | 내부 작업물 |
| API 키·토큰·인증서·개인 경로가 포함된 파일 | 보안 위험 |

---

## 공개 전 검증 순서

### 1. 코드 품질 확인

```bash
npm test       # 120개 테스트 전부 통과 확인
npm run build  # TypeScript 빌드 오류 없음 확인
```

### 2. 로컬 동작 확인

```bash
npm run engine -- run tests/fixtures/valid-low-cost-request.json
npm run engine -- doctor
```

### 3. 파일 상태 확인

```bash
git status     # 스테이징 대상 파일 확인
```

아래 항목이 보이면 반드시 제외합니다:
- `.env`
- `node_modules/`
- `dist/`
- `*.log`
- 개인 경로나 API 키가 포함된 파일

### 4. 최종 점검 후 커밋·푸시

```bash
git add .
git status       # 한 번 더 확인
git commit -m "..."
git push
```

---

## 시크릿 관리 원칙

- API 키, 토큰, 인증서는 절대 저장소에 저장하지 않습니다.
- `.env` 파일은 프로젝트 폴더 외부에 보관하거나 런타임에만 주입합니다.
- `.env.example`에는 실제 값 없이 변수 이름과 형식만 기록합니다.
- `git add .` 후 반드시 `git status`로 포함된 파일을 확인합니다.

---

## 최종 체크리스트

```
□ npm test 전부 통과
□ npm run build 오류 없음
□ .env 파일 미포함 확인
□ node_modules/, dist/ 미포함 확인
□ 소스 코드나 문서에 개인 경로·API 키 미포함 확인
□ git status로 커밋 대상 파일 최종 검토
□ git push
```
