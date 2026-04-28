---
name: review
description: card-news-app 변경사항을 별도 컨텍스트의 QA 에이전트로 리뷰. Hook 통과 + docs 정합 + 반복 패턴 감지
---

# /review — 코드 리뷰 (QA 별도 세션)

> **핵심**: QA는 반드시 **새 컨텍스트의 서브에이전트**로 실행한다. 코드를 작성한 에이전트가 자기 코드를 리뷰하면 항상 과대평가하므로, 별도 컨텍스트의 회의적 평가자가 정직한 피드백을 제공한다.

## 1. 리뷰 대상 파악

다음으로 변경 범위를 결정 (`$ARGUMENTS` 우선):
- 인자 있음: 지정된 파일/디렉터리만 리뷰
- 인자 없음 + 브랜치가 main이 아님: `git diff main...HEAD`로 PR 단위 리뷰
- 인자 없음 + 브랜치가 main: `git diff HEAD~1`로 최근 커밋 리뷰

```bash
git branch --show-current
git diff main...HEAD --stat 2>/dev/null || git diff HEAD~1 --stat
```

## 2. QA 에이전트 호출 (별도 컨텍스트)

`Agent` 도구로 `card-news-qa` 에이전트를 **별도 서브에이전트**로 호출. 컨텍스트는 격리된다.

QA에게 전달할 입력:
- 변경 파일 목록 + diff
- `docs/FRONTEND.md`, `docs/DESIGN.md`, `docs/generated/api-schema.md` 경로 (참조용)
- 본 작업의 컨텍스트 (어떤 이슈/요청에서 나왔는지)

QA의 7개 체크리스트(`.claude/agents/card-news-qa.md` 참조):
1. 타입/린트 통과 (`npm run typecheck` + `npm run lint`)
2. **IPC 정합성** — `src/shared/types.ts` ↔ `src/main/ipc.ts` ↔ `src/preload/index.ts` ↔ `src/renderer` 4곳 shape 일치
3. 컨벤션 — Presentation/Container 분리, 150줄 룰
4. 상태관리 정합성 (resetProject 포함, undefined 처리)
5. 범위 가드 (renderer Node API, main JSX, 외부 레포 수정)
6. 에러 처리 (silent failure, console.* 신규 추가)
7. 회귀 시나리오 (영향 범위에 따라)

## 3. Hook 자동 교정 로그 확인

PostToolUse Hook이 어떤 항목을 자동 수정했는지 점검:
- `eslint --fix`가 의미를 바꾸지 않았는지
- 같은 규칙이 반복적으로 자동 수정됐다면 → harness-feedback 트리거 후보 (Level 2.5)

## 4. 반복 패턴 감지

이전 리뷰(`docs/design-docs/feedback-log.md` 표) 또는 최근 커밋 메시지에서 동일 패턴이 두 번 이상 발견되면:
```
"이 패턴이 반복되는데 ESLint 규칙(Level 2)으로 승격할까요?"
또는
"교정 지시(Level 2.5)를 업데이트할까요?"
```
→ `harness-feedback` 스킬 호출 제안

## 5. 결과 분류 + 보고

```
## 코드 리뷰: {브랜치 또는 범위}

### 요약
- 변경 파일: {N}개  +{추가} -{삭제}
- Hook 자동 수정: {N}건

### 🔴 Critical (머지 차단)
- {파일:라인} 설명 + 권장 패치

### 🟡 Warning (수정 강하게 권장)
- {파일:라인} 설명

### 🔵 Info (개선 여지)
- {파일:라인} 설명

### 💡 Suggestion (별도 이슈로 등록 제안)
- 설명

### ✅ Good
- 잘된 부분
```

## 6. 처리

- **Critical**: 작성 에이전트(`card-news-renderer-ui` 또는 `card-news-main-logic`)에 반환하여 수정 요청. **자동 수정 금지** (QA는 지적만, 수정은 작성자 책임)
- **Warning**: 사용자에게 수정 여부 확인
- **Info / Suggestion**: 보고만, 별도 이슈로 등록 권장 시 `github-issue-create` 트리거

## 7. 재시도 한계

같은 작업을 2회 critical 반려 후에도 통과 못 하면:
- **무한 루프 방지**: 사용자에게 escalate
- 보고 형식: 어떤 항목이 어떤 이유로 반복 실패하는지 + 추정 원인 + 다음 액션 권장

## 인자

- `$ARGUMENTS` 있으면: 해당 파일/디렉터리만 집중
- 없으면: 브랜치 단위 또는 최근 커밋
