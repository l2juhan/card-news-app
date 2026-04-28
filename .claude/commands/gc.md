---
name: gc
description: 코드베이스 가비지 컬렉션 — 드리프트 전수 스캔 + docs 동기화 + 데드 코드 정리 + 패턴 위반 감지
---

# /gc — 가비지 컬렉션 (Garbage Collection / Drift Cleanup)

> AI 에이전트는 기존 코드를 보고 패턴을 따라하기 때문에 나쁜 패턴이 스노우볼된다.
> `/gc`는 그것을 주기적으로 막는다. 매주 1회 또는 큰 작업 끝낸 직후 실행 권장.
> 범위 밖: `templates/`, `scripts/`, `node_modules/`, `dist/`, `release/`, `build/`, `output/`, `workspace/` (외부 레포 또는 빌드 결과물).

## 1단계: 문서 ↔ 코드 동기화 점검

### `docs/FRONTEND.md` vs 실제 코드
- 컨벤션 항목(11개 섹션)을 하나씩 grep
- 위반 사례 발견 시 표로 정리:
  ```
  | 규칙 | 위반 파일:라인 | 수정 필요? |
  ```

### `docs/DESIGN.md` vs 실제 코드
- 디자인 토큰(색/타이포/스페이싱) 사용 여부
- 하드코딩된 hex 색상 검색: `grep -rE "#[0-9A-Fa-f]{6}\b" src/renderer/`
- 등록되지 않은 새 토큰이 반복 사용되는지

### `docs/generated/` vs 실제 코드 (자동 갱신)
- `api-schema.md` vs 현재 `src/shared/types.ts` + `src/main/ipc.ts`
- `component-inventory.md` vs 현재 `src/renderer/components/` 스캔 결과
- 차이가 있으면 generated/ 파일을 자동 갱신 (이게 generated의 역할)

## 2단계: 패턴 드리프트 전수 스캔

다음을 모든 `.ts/.tsx`에 grep (templates/, scripts/, node_modules/, dist/, release/, build/ 제외):

| 패턴 | 검색 정규식 | 처리 |
|------|------------|------|
| 하드코딩 hex 색상 | `#[0-9A-Fa-f]{6}` | docs/DESIGN.md에 토큰 등록 후 치환 제안 |
| `any` 타입 | `:\s*any\b\|<any>\|as\s+any` | unknown + 타입 가드로 교정 제안 |
| `console.log` / `console.error` 등 | `console\.\w+\(` | logger 도입 또는 IPC 에러 broadcast로 교정 |
| 인라인 `style={...}` | `style=\{\{` | 동적 색이면 OK, 아니면 Tailwind 클래스로 |
| 절대 경로 하드코딩 | `["']\\/Users\|["']C:\\\\` | path.resolve / app.getPath로 교정 |
| `as unknown as X` 캐스팅 | `as\s+unknown\s+as\b` | 타입 가드로 교정 |
| useEffect 안 setState | (AST 또는 ESLint react-hooks/set-state-in-effect) | useMemo / 이벤트 핸들러로 |

발견 결과:
```
| 패턴 | 위반 건수 | 자동 수정 가능? | 예상 작업량 |
```

## 3단계: 데드 코드 정리

- **미사용 export**: `tsc --noEmit` + `noUnusedLocals`/`noUnusedParameters` 설정 확인 (또는 ts-prune 같은 도구)
- **미사용 파일**: `src/` 전체에서 어디서도 import되지 않는 파일
- **미사용 의존성**: `npm ls` + `package.json` vs 실제 import 비교 (또는 depcheck)
- **미사용 store 필드**: `useCardNewsStore` 필드 중 selector로 안 쓰이는 것

→ 삭제 제안 목록을 사용자에게 표시 후 확인 받아 실행 (자동 삭제 금지)

## 4단계: P/C 분리 진척 추적

- 컴포넌트 파일별 줄 수 측정
- 150줄 이상 파일 목록
- Container 비율 변화 (베이스라인 대비)
- `docs/generated/component-inventory.md`의 통계 섹션 업데이트

## 5단계: 드리프트 방지 조치

- 같은 패턴 위반이 3건 이상 → `harness-feedback` 호출 제안 (Level 2 또는 2.5)
- 새로 발견된 토큰 후보(예: 같은 hex가 3번+) → `docs/DESIGN.md` 등록 제안
- 새로운 컴포넌트가 즉시 docs에 등록되지 않은 경우 → component-inventory.md 갱신

## 6단계: 보고 + 갱신 + 기록

```
## /gc 결과 — {YYYY-MM-DD}

### 문서 동기화
- generated/api-schema.md: {갱신됨 / 변경 없음}
- generated/component-inventory.md: {갱신됨}

### 패턴 드리프트
- {pattern}: {N}건 (자동 수정 가능 K건)
- 자동 수정 적용? (y/n/일부)

### 데드 코드
- 미사용 파일: {목록}
- 미사용 의존성: {목록}

### P/C 분리
- 150줄 초과: {N}개 → 분리 후보
- Container 비율: {%} (지난번 대비 변화)

### harness-feedback 후보
- {pattern}: {N}회 → Level 2 승격 제안

### 다음 액션
- {권장사항}
```

`docs/QUALITY_SCORE.md` 갱신 + `docs/design-docs/feedback-log.md`에 기록 추가.

## 범위 밖

- ❌ `templates/`, `scripts/`, `config.json` (외부 레포 symlink)
- ❌ `node_modules/`, `dist/`, `release/`, `build/`, `output/`, `workspace/`
- ❌ git history 리라이트
- ❌ 사용자 확인 없는 자동 삭제

## 인자

- `$ARGUMENTS` 있으면 해당 디렉터리만 (예: `/gc src/renderer/components`)
- 없으면 src/ 전체 + docs 동기화
