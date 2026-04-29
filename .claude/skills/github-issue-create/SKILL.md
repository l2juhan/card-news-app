---
name: github-issue-create
description: GitHub 이슈를 생성하는 워크플로우. "이슈 만들어줘", "이슈 생성", "이슈화 해줘", "버그 리포트", "이슈로 등록", "issue 만들어", "create issue", "file an issue" 같은 표현이 나오면 반드시 트리거. .github/ISSUE_TEMPLATE/의 기존 템플릿(feature/bug/refactor/design)을 반드시 따르며 자체 포맷 사용은 금지. 코드 분석 기반 자동 이슈 생성과 배치 생성도 지원.
---

# github-issue-create — 이슈 생성 워크플로우

card-news-app의 모든 이슈는 `.github/ISSUE_TEMPLATE/`의 정해진 템플릿을 따른다. 이 스킬이 자체 포맷을 사용하면 팀 일관성이 깨진다.

## 핵심 원칙

1. **반드시 .github/ISSUE_TEMPLATE/ 템플릿을 사용한다.** 자체 포맷 금지.
2. **라벨은 .github/ISSUE_TEMPLATE/{template}.md의 frontmatter `labels:` 필드를 따른다.** 추가 라벨(area:*) 부착 권장.
3. **이슈 생성 전 사용자에게 반드시 확인을 받는다.** 단일 생성도 미리보기 후 확인. 배치는 목록 확인 후 일괄 생성.

## Step 1: 사용자 의도 분석

사용자 설명에서 다음을 추출:
- **유형**: 새 기능 / 버그 / 리팩터링 / 디자인 → 어떤 템플릿을 쓸지 결정
- **제목**: 한 줄 요약
- **본문 재료**: 배경, 재현 절차, 영향 영역, 완료 기준 등
- **우선순위 / 마일스톤**: 명시되었으면 추출

## Step 2: 템플릿 선택

```text
.github/ISSUE_TEMPLATE/
├── feature.md   → 새 기능 / 기능 확장
├── bug.md       → 버그
├── refactor.md  → 리팩터링 / 기술 부채
└── design.md    → 디자인 / UX 개선
```

각 템플릿의 frontmatter `labels:`를 그대로 사용 (예: `["type:feature"]`).

## Step 3: 본문 채우기

해당 템플릿 파일을 읽어서 모든 섹션을 채운다. 정보 부족한 섹션은:
- 코드 분석으로 보완 가능하면 자동 채움 (예: 영향 파일 추정)
- 사용자만 알 수 있는 정보(완료 기준 등)는 placeholder로 두고 사용자에게 확인 요청

## Step 4: 라벨 보강

frontmatter 라벨(`type:*`)에 더해, area 라벨을 추가:
- `area:renderer` — UI/컴포넌트/store
- `area:main` — Main 프로세스
- `area:preload` — preload 브리지
- `area:template` — 카드뉴스 템플릿(주의: 이런 이슈는 instagram-card-news 레포에 등록해야 할 수도 있음)
- `area:build` — electron-builder/vite/esbuild

판단 기준: 본문에서 언급된 파일/기능 → area 매핑.

## Step 5: 미리보기 + 확인

```text
다음 이슈를 생성하려고 합니다:

【제목】
[Feature] 슬라이드 자동 저장 기능 추가

【라벨】
type:feature, area:renderer, area:main

【본문】
(전체 본문 표시)

생성할까요? (y / 수정 / 취소)
```

## Step 6: 이슈 생성

```bash
gh issue create \
  --title "{제목}" \
  --body-file /tmp/issue-body.md \
  --label "type:feature,area:renderer,area:main" \
  --milestone "{milestone if any}"
```

생성된 이슈 URL을 사용자에게 표시.

## 배치 생성 (PRD → 이슈 목록 변환)

사용자가 PRD나 기능 리스트를 제공하면:

1. **분해**: 큰 단위를 작은 이슈(1~3일 작업량)로 분해
2. **목록 표시**:

   ```text
   다음 N개 이슈를 생성하려고 합니다:

   1. [Feature] 슬라이드 자동 저장 (area:renderer, area:main)
   2. [Feature] 키보드 단축키 가이드 (area:renderer)
   3. [Refactor] ipc.ts 핸들러 공통화 (area:main)
   ...

   순서대로 생성할까요? (y / 일부만 / 취소)
   ```
3. **확인 후 일괄 생성** — 각각 `gh issue create` 호출
4. **결과 요약** — 생성된 이슈 번호 + URL 목록

## 코드 분석 기반 이슈 생성

사용자가 "이 코드 문제 이슈로 등록"이라고 하면:
1. 현재 변경 또는 지정 파일 분석
2. 발견 사항을 `bug.md` 또는 `refactor.md` 템플릿에 매핑
3. 영향 영역 자동 추정 → area 라벨 부착
4. 미리보기 → 확인 → 생성

## 범위 밖 (거부 조건)

- ❌ `.github/ISSUE_TEMPLATE/` 템플릿 자체 수정 — 사용자가 명시적으로 요청해야 함 (이는 별도 PR 작업)
- ❌ 자체 포맷으로 이슈 생성 — 템플릿이 없는 유형이면 사용자에게 새 템플릿을 만들지 물어봄
- ❌ instagram-card-news 레포에 이슈 생성 — 본 스킬은 card-news-app 전용. 콘텐츠/템플릿 이슈는 사용자가 해당 레포에서 생성
- ❌ assignee 자동 부착 — 1인 개발이라 무의미하지만, 협업이 시작되면 사용자 명시 시에만

## 사용 예시

| 사용자 입력 | 동작 |
|-----------|------|
| "PNG 내보내기 진행률이 안 보이는 버그 이슈 만들어줘" | bug 템플릿 사용 → 미리보기 → 확인 → 생성 |
| "ipc.ts 리팩터링 이슈로 등록" | 코드 분석 + refactor 템플릿 → 미리보기 → 확인 |
| "이 PRD를 이슈로 분해해줘" | PRD 분해 → 목록 표시 → 일괄 생성 |
| "ChatPanel 분리 작업 이슈화" | refactor 템플릿 → ChatPanel.tsx 분석 → area:renderer |
