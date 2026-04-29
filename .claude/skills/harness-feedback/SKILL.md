---
name: harness-feedback
description: 같은 실수가 반복될 때 하네스 규칙 자체를 보강하는 워크플로우. "같은 실수가 반복돼", "하네스 보강", "규칙 추가해줘", "피드백 루프", "교정 지시 업데이트", "ESLint 규칙 추가", "automation rule" 같은 표현이나, QA가 같은 패턴을 2회+ 반려하거나 PostToolUse Hook이 같은 규칙을 3회+ 자동 교정한 상황을 사용자가 보고하면 반드시 트리거. 4단계(Level 1→2→2.5→3) 보강 제안 후 사용자 확인 받아 적용. 단순한 코드 수정과 다르게 "수정 자체"가 아니라 "수정 자체가 반복되지 않도록 시스템을 바꾸는" 메타 작업.
---

# harness-feedback — 4단계 보강 루프

같은 위반/실수가 반복된다는 것은, 현재 하네스(docs, 린트, 테스트)가 그 패턴을 막지 못하고 있다는 신호다. 이 스킬은 보강의 강도를 단계적으로 올린다.

## 트리거 상황

| 상황 | 감지 방법 |
|------|----------|
| QA 에이전트가 같은 패턴 2회 이상 반려 | QA 출력 또는 사용자 보고 |
| PostToolUse Hook이 같은 ESLint 규칙을 3회 이상 자동 수정 | 사용자 보고 또는 Hook 로그 |
| 에이전트가 특정 ESLint 에러를 **잘못 고치는** 패턴 발견 | QA 또는 사용자 지적 |
| `/gc`가 같은 드리프트를 반복 보고 | `/gc` 출력 |
| 사용자가 같은 컨벤션을 두 번 이상 알려줌 | 대화 맥락 |

## 보강 단계

### Level 1 — 문서 보강 (소프트 강제)
규칙을 `docs/FRONTEND.md` 또는 `docs/DESIGN.md`에 명시 추가.

- **언제**: 규칙이 처음 발견됐고, 위반이 1~2회 정도일 때
- **어떻게**: 해당 docs의 적절한 섹션에 규칙 + 이유 + 예시 추가
- **효과**: 다음 작업 시 에이전트가 docs를 읽으면 자연스럽게 따름. 강제력은 약함

예시:
> docs/FRONTEND.md "10. 금지 패턴" 섹션에 "❌ useEffect 안에서 setState 직접 호출 (cascading render). 대신 useMemo 또는 이벤트 핸들러로 이동" 추가

### Level 2 — 린트 규칙 추가 (자동 교정 강화)
규칙을 ESLint 규칙으로 변환해 `eslint.config.mjs`에 추가.

- **언제**: 위반이 3회+ 반복되거나, 기계적으로 검증 가능한 규칙일 때
- **어떻게**:
  1. 적합한 ESLint 규칙(공식/플러그인/커스텀) 찾기
  2. `eslint.config.mjs`의 적절한 섹션(전역 / renderer / main)에 추가
  3. 처음에는 `warn`으로 시작 가능 (위반이 너무 많으면 단계적 승격)
- **효과**: PostToolUse Hook이 자동으로 잡거나 수정. 강제력 강함

예시:
```js
// eslint.config.mjs
'react-hooks/set-state-in-effect': 'error',
```

### Level 2.5 — 린트 교정 지시 업데이트 ⭐ 중요
**에이전트가 특정 린트 에러를 *잘못* 고치는 패턴**이 발견된 경우.

- **언제**: 린트 규칙은 있는데, 에이전트가 잘못된 방향으로 수정해서 같은 에러가 반복되거나 더 나쁜 코드가 됨
- **분석**:
  1. 어떤 규칙인지 식별 (예: `@typescript-eslint/no-explicit-any`)
  2. 에이전트가 어떻게 잘못 고쳤는지 패턴 분석 (예: `as unknown as X`로 캐스팅 우회)
  3. 올바른 교정 방법 명확화 (예: 타입 가드 함수 작성)
- **어떻게**: `eslint.config.mjs`의 해당 규칙 옆 주석(remediation comment)을 업데이트 또는 추가. 또는 `no-restricted-syntax`로 잘못된 우회 패턴 자체를 차단

예시 (실제 시나리오):
```
문제: any 에러 → 에이전트가 매번 `as unknown as Type` 으로 우회
원인: 교정 지시에 "unknown 사용"만 적혀있어서 타입 가드 없이 캐스팅함
개선: 교정 지시 업데이트 + no-restricted-syntax로 `as unknown as X` 자체 차단
```

```js
// 수정된 eslint.config.mjs
'@typescript-eslint/no-explicit-any': ['error', { /* ... */ }],
// + 새로 추가:
'no-restricted-syntax': ['error', {
  selector: "TSAsExpression > TSAsExpression[typeAnnotation.type='TSUnknownKeyword']",
  message: 'as unknown as X 캐스팅 금지. 타입 가드 함수 작성: function isX(v: unknown): v is X { ... }',
}],
```

### Level 3 — 구조적 테스트 추가 (기계적 검증)
패턴 검증 테스트를 `__tests__/structural/`에 추가.

- **언제**: 린트로 잡기 어렵거나, 파일 시스템/파일명/관계를 검증해야 할 때
- **어떻게**:
  1. `__tests__/structural/{NN}-{check-name}.test.ts` 생성
  2. 위반 파일/줄을 출력하는 테스트 작성
  3. CI 스크립트에 포함 (`npm run test:structural` — 미정의면 정의)
- **효과**: 코드뿐 아니라 구조 자체를 강제. 가장 강한 강제력

예시:
- "모든 컴포넌트 파일이 PascalCase인가"
- "src/shared/types.ts의 모든 IPC 페이로드 타입이 main/preload/renderer 셋에서 import되는가"

## 워크플로우

### Step 1: 문제 패턴 파악
사용자 보고 또는 자동 감지로부터:
- **무엇이** 반복되는가?
- **어디서** (파일/영역) 발생했나?
- **얼마나 자주**? (횟수가 많을수록 높은 Level 적용)

### Step 2: 적합한 Level 추천
1~2회: Level 1
3회 이상 + 기계적 검증 가능: Level 2
린트는 있는데 잘못 고침: Level 2.5
린트로 부족 + 구조 강제 필요: Level 3

복합 적용 가능 (예: Level 1 + Level 2 동시).

### Step 3: 사용자 확인
```
다음 보강을 제안합니다:

【반복 패턴】
SlideEditor.tsx에서 useEffect 안 setState (3회 발견)

【제안 Level】
Level 2: ESLint 규칙 'react-hooks/set-state-in-effect': 'error' 추가
Level 1: docs/FRONTEND.md 금지 패턴 섹션에 규칙 추가

【파일 변경】
- eslint.config.mjs
- docs/FRONTEND.md

적용할까요? (y / Level만 변경 / 취소)
```

### Step 4: 적용
사용자 확인 시 변경. 변경 후 영향 받는 기존 코드 점검:
- 새 ESLint 규칙으로 기존 코드에서 새 위반이 잡히면 사용자에게 보고

### Step 5: 기록
`docs/design-docs/feedback-log.md` 표 상단에 추가:
```
| 2026-04-28 | useEffect 안 setState | Level 1+2 | docs/FRONTEND.md 추가, eslint.config.mjs에 react-hooks/set-state-in-effect 추가 | (관련 이슈/PR URL) |
```

## 범위 밖 (거부 조건)

- ❌ 한 번만 발생한 문제로 규칙 추가 — 우연 가능성. 패턴이 굳어졌을 때만 보강
- ❌ 사용자 확인 없이 ESLint 규칙 추가/삭제 — 모든 코드에 영향 미치므로 반드시 확인
- ❌ 다른 프로젝트 컨벤션 그대로 복사 — 이 프로젝트의 코드 패턴 분석 후 적합한 규칙만
- ❌ 기존 통과하던 규칙을 갑자기 'error'로 승격 — 'warn' 단계 거치며 점진적

## 사용 예시

| 사용자 입력 | 동작 |
|-----------|------|
| "이 useEffect 패턴 자꾸 잘못 쓰네" | Level 1+2 제안 |
| "ESLint이 any 잡는데 자꾸 as unknown으로 우회함" | Level 2.5 — remediation 업데이트 |
| "컴포넌트 파일명 자꾸 camelCase로 만들어" | Level 3 — 구조 테스트 |
| "하네스 보강해줘" | 최근 QA/Hook 로그 분석 → 패턴 도출 → 제안 |
