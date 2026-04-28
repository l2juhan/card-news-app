---
name: health
description: 하네스 자체의 건강 점검 — docs ↔ 코드 ↔ ESLint 정합 + Hook 동작 + 설정 무결성
---

# /health — 하네스 건강 점검

> 하네스의 다섯 계층(Hook · QA · feedback · gc · health)이 서로 모순 없이 동작하는지 확인.
> 매주 1회 또는 큰 변경 후 실행 권장.

## 1. 디렉터리 구조 무결성

다음 경로가 모두 존재하고 올바른 형태인지 확인:

```
✅ .claude/agents/{card-news-renderer-ui,card-news-main-logic,card-news-qa}.md
✅ .claude/skills/{github-issue-work,github-issue-create,harness-feedback}/SKILL.md
✅ .claude/skills/{card-news,edit-card-news,create-template,style-*}.md  (콘텐츠 도메인 15개)
✅ .claude/commands/{phase,commit,end,test,review,gc,health,quality}.md
✅ .claude/settings.json (Hook 설정)
✅ .claude/hooks/posttooluse-lint.sh (실행 권한)
✅ docs/{FRONTEND,DESIGN,QUALITY_SCORE}.md
✅ docs/design-docs/{index,core-beliefs,feedback-log}.md
✅ docs/generated/{README,api-schema,component-inventory}.md
✅ docs/{exec-plans,references}/.gitkeep
✅ __tests__/structural/README.md
✅ eslint.config.mjs, .prettierrc.json, .prettierignore
✅ .github/ISSUE_TEMPLATE/{feature,bug,refactor,design}.md
✅ .github/pull_request_template.md
```

누락/symlink 깨짐 발견 시 보고 + 자동 복구 제안.

## 2. docs/generated/ 동기화 확인

- `docs/generated/api-schema.md` vs 현재 `src/shared/types.ts` + `src/main/ipc.ts`
  - IPC 채널 추가/삭제 여부
  - 페이로드 타입 변경 여부
- `docs/generated/component-inventory.md` vs `src/renderer/components/` 스캔
  - 새 컴포넌트 추가 / 기존 삭제
  - P/C 분류 변화

차이가 있으면 자동 갱신 (이게 generated의 역할).

## 3. docs/FRONTEND.md 규칙 vs `eslint.config.mjs` 일치

각 docs 규칙을 ESLint로 잡고 있는지 매핑:

| docs 규칙 | ESLint로 강제? | 처리 |
|-----------|---------------|------|
| `any` 금지 | ✅ `@typescript-eslint/no-explicit-any` | OK |
| `console.*` 금지 | ✅ `no-console` | OK |
| Renderer Node API 금지 | ✅ `no-restricted-imports` | OK |
| Main JSX 금지 | ✅ `no-restricted-syntax` (JSXElement) | OK |
| `as unknown as X` 금지 | ✅ `no-restricted-syntax` | OK |
| Presentation/Container 분리 | ❌ (구조적 검증 어려움) | Level 3 구조 테스트 또는 QA 수동 |
| 150줄 룰 | ❌ | `/gc`에서 보고 |
| IPC 4곳 동기화 | ❌ | `/health` 또는 Level 3 구조 테스트 |

**정합성 점검 결과:**
- 문서에만 있고 ESLint 없는 항목 → Level 2 승격 검토 제안
- ESLint에 있는데 문서에 없는 항목 → 문서 갱신 제안
- 교정 지시(remediation comment)가 부족한 규칙 → Level 2.5 업데이트 제안

## 4. Hook 정상 동작 확인

```bash
# .claude/settings.json + 실행 권한 + jq 가용성
test -f .claude/settings.json
test -x .claude/hooks/posttooluse-lint.sh
which jq

# eslint / tsc 실행 가능 여부
npx eslint --version
npx tsc --version
```

수동 검증:
- 임시 `.ts` 파일에 의도적 ESLint 위반(예: `const x: any = 1`) 작성 → 저장 → Hook이 잡는지 → 임시 파일 삭제
- 위 단계는 `/health`가 사용자에게 가이드만, 실제 실행은 사용자가

## 5. QUALITY_SCORE.md 갱신

`/quality` 결과를 그대로 가져와 갱신하지 않고, 다음만 점검:
- 마지막 평가 날짜가 30일 이상 지났으면 → `/quality` 실행 제안
- N/A 항목이 평가 가능한 영역인지 확인 (예: 테스트 영역은 테스트 도입 후 평가)

## 6. 피드백 로그 요약

`docs/design-docs/feedback-log.md` 최근 10건 요약:
- 가장 자주 보강된 영역
- 보강 후 재발 여부 (있으면 더 강한 Level 권장)

## 7. 보고

```
## /health 결과 — {YYYY-MM-DD}

### ✅ 정상
- 디렉터리 구조 (15/15)
- generated/ 동기화 ({갱신 N건})
- Hook 동작

### ⚠️ 주의
- {규칙}: docs에만 있고 ESLint 없음 → Level 2 승격 검토
- {규칙}: 교정 지시 불충분 → Level 2.5 업데이트 검토

### 🔴 조치 필요
- {파일}: 누락
- {settings}: Hook 설정 오류

### 권장 다음 액션
- {harness-feedback / /gc / /quality 호출 제안}
```

## 인자

- `$ARGUMENTS` 없음 (전수 점검)
- 빠른 체크는 `/gc`로 대신
