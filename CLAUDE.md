# Card News App — Claude Operating Manual

> 이 문서는 항상 컨텍스트에 로드된다. **100줄 이내**를 유지하고, 상세 내용은 `docs/` 아래 문서로 분리한다.

## 프로젝트 한 줄 정의
Instagram 카드뉴스를 GUI로 생성/편집/내보내는 **Electron 데스크톱 앱**. 엔진은 `@anthropic-ai/claude-agent-sdk` + Puppeteer.

## 내 역할 (1인)
프론트엔드 + 디자인 + Main 프로세스 전부 담당. **백엔드/서버는 없다.** Renderer ↔ Main 경계는 IPC로만 넘는다.

## 기술 스택
Electron 41 · React 19 · TypeScript 5.9 (strict) · Vite 8 · esbuild · Zustand 5 · Tailwind 4 · Puppeteer · electron-builder · electron-updater.

## Symlink로 외부 레포 연동
`templates/`, `scripts/`, `config.json` → `../instagram-card-news/` 로 symlink. **이 3개는 본 레포에서 직접 수정 금지** (instagram-card-news 원본에서 관리).
`.claude/skills/`는 더 이상 symlink가 아니며 본 레포 소유.

## 코드 컨벤션 (5개 핵심)
1. **Renderer/Main/Preload 경계 침범 금지**. Renderer는 `window.api`로만 IPC. main/preload만 Node API.
2. **컴포넌트는 Presentation/Container 분리**. props만 받는 것은 P, store/hook/IPC를 호출하는 것은 C. 한 파일 150줄 넘으면 분리 검토.
3. **상태**: UI 상태 = useState · 앱 전역 = `useCardNewsStore`(단일 store) · 외부 API 없음.
4. **타입**: `any` 금지. IPC 페이로드 타입은 `src/shared/types.ts` 한 곳에 정의 후 main/preload/renderer가 공유.
5. **에러**: silent failure 금지. catch에서 `card-news:error` 또는 사용자 표시. `console.*` 신규 추가 금지(logger 사용).

상세 규칙: `docs/FRONTEND.md` · 디자인 토큰: `docs/DESIGN.md`.

## .claude/ 구조

```text
.claude/
├── settings.json           # PostToolUse Hook (자동 lint+typecheck)
├── agents/                 # 팀 에이전트 3개
│   ├── card-news-renderer-ui.md   # src/renderer/** 담당
│   ├── card-news-main-logic.md    # src/main, src/preload, src/shared/types 담당
│   └── card-news-qa.md            # 별도 컨텍스트 검증, 2회 반려 한계
├── skills/                 # 자동 트리거 (키워드 매칭)
│   ├── card-news.md, edit-card-news.md, create-template.md, style-*.md
│   │   → 콘텐츠 도메인 (앱 사용자가 카드뉴스 만들 때)
│   ├── github-issue-work/, github-issue-create/
│   │   → "issue #N" / "이슈 만들어줘" 트리거
│   └── harness-feedback/   → 반복 패턴 감지 시 4단계 보강 제안
└── commands/               # /명령어로 명시적 호출
    ├── phase, commit, end, test  (기존)
    ├── review     → /review (QA 별도 세션)
    ├── gc         → /gc (가비지 컬렉션, 드리프트 정리)
    ├── health     → /health (하네스 건강 점검)
    └── quality    → /quality (품질 등급 재평가)
```

## 자동 교정 루프 (5계층 방어)
1. **PostToolUse Hook** — 파일 저장 즉시 `eslint --fix` + `tsc --noEmit`. 에러는 컨텍스트로 주입되어 에이전트가 스스로 수정.
2. **QA 에이전트** — 작업 완료 시 별도 컨텍스트에서 7개 체크리스트 검증.
3. **harness-feedback** — 반복 위반 → ESLint 규칙 승격 + 교정 지시 자동 진화.
4. **/gc** — 주기적 전수 스캔으로 스노우볼 방지.
5. **/health** — 문서 ↔ 린트 정합성 자체 점검.

## GitHub 워크플로우
- 모든 작업은 **GitHub 이슈 기반**. 머지 전략: Squash and Merge.
- 이슈 라벨: `type:{feature,bug,refactor,design}` + `area:{main,renderer,preload,template,build}`.
- 작업 시작: "issue #N 작업" / 이슈 생성: "이슈 만들어줘".
- 진행 중인 작업 계획: `docs/exec-plans/`.

## docs/ 색인
- `docs/FRONTEND.md` — 프론트 컨벤션 (코드 분석 기반)
- `docs/DESIGN.md` — 디자인 토큰 + 스타일 규칙
- `docs/QUALITY_SCORE.md` — 영역별 품질 등급
- `docs/design-docs/` — 핵심 원칙, 피드백 로그
- `docs/generated/` — IPC 스키마, 컴포넌트 인벤토리 (자동 생성, 수정 금지)
- `docs/references/` — 외부 라이브러리 참고
- `docs/exec-plans/` — 진행 중 작업 계획

## 커밋 규칙
Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`). Co-Authored-By 라인 포함하지 않음.

## 개발 명령어
`npm run dev` (개발) · `npm run build` (전체 빌드) · `npm run typecheck` · `npm run lint` · `npm run lint:fix` · `npm run format` · `npm run package:mac|win`.
