---
name: github-issue-work
description: "GitHub 이슈 번호로 작업을 시작/진행/완료하는 워크플로우. 'issue #N', '이슈 #N', '이슈 N번', '#N 작업', '#N 해줘', '깃허브 이슈', 'github issue N' 같은 표현이 나오면 반드시 트리거. 이슈 본문을 읽고 작업 계획을 docs/exec-plans/에 저장한 뒤 적절한 에이전트(card-news-renderer-ui / card-news-main-logic)에 위임한다. PR 생성 트리거가 아니라 작업 진행 트리거임에 유의."
---

# github-issue-work — 이슈 기반 작업 워크플로우

card-news-app은 모든 작업을 GitHub 이슈로 추적한다. 이 스킬은 사용자가 이슈 번호를 언급하면 자동으로:
1. 이슈 내용을 가져와 분석하고
2. 작업 계획을 `docs/exec-plans/`에 저장하고
3. 영역에 맞는 에이전트(`card-news-renderer-ui`, `card-news-main-logic`)에 위임하고
4. 이슈에 진행 상황을 코멘트로 기록한다.

## Step 1: 이슈 조회

```bash
gh issue view {N} --json number,title,body,labels,assignees,milestone,state,url
```

다음을 추출:
- **번호 + 제목**
- **본문(body)** — 작업 범위, 완료 기준
- **라벨** — `type:*`(작업 유형), `area:*`(영향 영역)
- **상태** — open/closed (closed면 즉시 중단하고 사용자에게 알림)

## Step 2: 작업 유형 + 영역 판단

라벨로부터:

| 라벨 | 작업 유형 | 주 담당 에이전트 |
|------|----------|------------------|
| `type:feature` | 기능 추가 | area에 따라 결정 |
| `type:bug` | 버그 수정 | area에 따라 결정 |
| `type:refactor` | 리팩터링 | area에 따라 결정 |
| `type:design` | 디자인/UX | `card-news-renderer-ui` |

| area 라벨 | 담당 에이전트 |
|-----------|--------------|
| `area:renderer` | `card-news-renderer-ui` |
| `area:main` | `card-news-main-logic` |
| `area:preload` | `card-news-main-logic` |
| `area:template` | **거부** — instagram-card-news 원본 레포에서 작업해야 함을 안내 |
| `area:build` | `card-news-main-logic` 또는 사용자 (electron-builder 변경은 신중히) |

라벨이 없으면 본문에서 키워드로 추정 + 사용자 확인.

## Step 3: 작업 계획 생성

`docs/exec-plans/{YYYY-MM-DD-HHMM}-issue-{N}.md` 생성 (같은 이슈를 같은 날 재실행해도 덮어쓰지 않도록 시각 포함):

```markdown
# Issue #{N}: {title}

- **URL**: {issue url}
- **Labels**: {labels}
- **Milestone**: {milestone or N/A}
- **상태**: in_progress
- **시작**: {YYYY-MM-DD HH:MM}

## 목표
{이슈 본문에서 추출한 한두 문장}

## 영향 범위
- {area 라벨 기반}
- {예상 변경 파일 목록 — Glob으로 후보 파악}

## 작업 분해
- [ ] {작업 1}
- [ ] {작업 2}
- [ ] QA 검증 (card-news-qa)
- [ ] PR 생성 (Squash and Merge)

## 완료 기준
{이슈 본문 또는 PR 템플릿의 체크리스트 기반}

## 진행 메모
- {YYYY-MM-DD HH:MM}: 작업 시작
```

## Step 4: 작업 시작 코멘트

```bash
gh issue comment {N} --body "🚀 작업 시작 (claude-code 자동 진행)

작업 계획: \`docs/exec-plans/{YYYY-MM-DD}-issue-{N}.md\`
주 담당 에이전트: {agent_name}
영향 영역: {area_labels}"
```

## Step 5: 에이전트 위임

작업 영역에 따라 에이전트에게 위임. 위임 형식:

```text
다음 이슈를 처리해줘.

## Issue #{N}: {title}
{본문 핵심 발췌}

## 작업 계획
{docs/exec-plans/{file} 경로 참조}

## 완료 후 처리
- card-news-qa에 검증 요청
- 검증 통과 시 PR 생성 준비 (사용자가 최종 확인)
```

영향이 renderer + main 양쪽에 걸치면:
- 두 에이전트를 모두 팀에 포함
- IPC 시그니처 변경이 있으면 main-logic이 먼저 → renderer-ui가 후속

## Step 6: 작업 완료 코멘트

작업 종료 후(QA 통과 또는 사용자 일시중단):

```bash
gh issue comment {N} --body "✅ 1차 작업 완료

## 변경 파일
- \`src/...\` (변경 요약)
- ...

## QA 결과
- {pass / N건 warning / 사용자 확인 필요}

## 다음 단계
- PR 생성: gh pr create (사용자 승인 후)"
```

## Step 7: 이슈 close 정책

**이슈를 직접 close하지 않는다.** PR이 머지될 때 PR description의 `Closes #{N}`으로 자동 close. 이는 PR ↔ 이슈 추적성을 보존하기 위함.

## 참조 문서

- `.github/ISSUE_TEMPLATE/` — 이슈 본문 형식
- `.github/pull_request_template.md` — PR 형식
- `docs/FRONTEND.md` — 컴포넌트/IPC 컨벤션
- `docs/DESIGN.md` — 디자인 토큰
- `docs/QUALITY_SCORE.md` — 영역별 품질 등급

## 범위 밖 (거부 조건)

- ❌ `area:template` 라벨 이슈 — 본 레포 templates는 symlink. 사용자에게 instagram-card-news 레포에서 작업하라고 안내
- ❌ 백엔드/서버 관련 이슈 — 본 프로젝트는 백엔드 없음. 이슈 잘못 등록 가능성 → 사용자에게 확인
- ❌ closed 상태인 이슈 — 새 이슈 생성 또는 reopen 사용자 결정 필요
- ❌ assignee가 다른 사람인 이슈 — 사용자 확인 필요

## 사용 예시

| 사용자 입력 | 동작 |
|-----------|------|
| "issue #12 작업하자" | 이슈 12번 조회 → 계획 생성 → 에이전트 위임 |
| "이슈 #12 해줘" | 동일 |
| "12번 이슈 어떻게 해야 해?" | 조회 + 계획만 작성, 위임 전 사용자 확인 |
| "github issue 12" | 조회 + 위임 |
