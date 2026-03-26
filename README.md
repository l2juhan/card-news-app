# Card News Generator

Instagram 카드뉴스를 GUI 기반으로 생성/편집/내보내기하는 Electron 데스크톱 앱.
Claude Code SDK를 엔진으로 활용하여 AI 기반 카드뉴스를 자동 생성합니다.

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Electron |
| 프론트엔드 | React 19 + TypeScript |
| 빌드 도구 | Vite (renderer) + esbuild (main) |
| Claude 연동 | @anthropic-ai/claude-agent-sdk |
| 카드 렌더링 | Puppeteer (HTML → PNG) |
| 스타일링 | Tailwind CSS |
| 상태관리 | Zustand |
| 패키징 | electron-builder |

## 설치

```bash
npm install
```

### 참조 프로젝트 연동

이 프로젝트는 [instagram-card-news](../instagram-card-news/)의 템플릿, 렌더링 스크립트, 스킬을 symlink로 참조합니다.
`../instagram-card-news/` 디렉토리가 같은 레벨에 존재해야 합니다.

```
Desktop/
├── card-news-app/          ← 이 프로젝트
└── instagram-card-news/    ← 참조 프로젝트 (symlink 대상)
```

Symlink 목록:
- `templates/` → 12개 스타일 HTML 템플릿
- `config.json` → 스타일/해상도 설정
- `scripts/` → Puppeteer 렌더링 스크립트
- `.claude/skills/` → 카드뉴스 생성/수정 스킬

## 개발

```bash
# 개발 모드 (Vite HMR + Electron)
npm run dev

# 타입 체크
npm run typecheck

# 빌드
npm run build

# 패키징
npm run package
```

## 지원 템플릿 스타일

| 스타일 | 설명 | 해상도 |
|--------|------|--------|
| minimal | 깔끔 정보전달형 | 1080x1350 |
| bold | 강렬 임팩트형 | 1080x1350 |
| elegant | 고급감성형 | 1080x1350 |
| premium | 다크 프리미엄형 | 1080x1350 |
| toss | 토스 울트라 미니멀 | 1080x1350 |
| magazine | 매거진 포토형 | 1080x1350 |
| clean | 클린 에디토리얼형 | 1080x1350 |
| blueprint | 블루프린트형 | 1080x1350 |
| aws | AWS 서비스형 | 1080x1350 |
| rn | React Native 튜토리얼형 | 1080x1080 |
| cs | CS 교육형 | 1080x1080 |
| linux | Linux 정보형 | 1080x1080 |

## 프로젝트 구조

```
card-news-app/
├── src/
│   ├── main/              # Electron Main Process
│   │   ├── index.ts       # 앱 진입점, BrowserWindow 생성
│   │   ├── ipc.ts         # IPC 핸들러 (생성/편집/내보내기)
│   │   ├── claude.ts      # Claude Code SDK 래퍼
│   │   ├── renderer.ts    # Puppeteer HTML→PNG 렌더링
│   │   └── template.ts    # 템플릿 로드 및 플레이스홀더 치환
│   ├── preload/           # Preload 스크립트
│   │   └── index.ts       # contextBridge API 노출
│   ├── renderer/          # React Renderer Process
│   │   ├── App.tsx        # 3패널 레이아웃 (사이드바|채팅|미리보기)
│   │   ├── components/    # UI 컴포넌트 (12개)
│   │   ├── hooks/         # useIpc, useChat, useExport, useKeyboard
│   │   ├── stores/        # Zustand 스토어
│   │   └── styles/        # Tailwind CSS 글로벌 스타일
│   └── shared/
│       └── types.ts       # Main/Renderer 공유 타입 정의
├── templates/ → symlink   # 12개 스타일 HTML 템플릿
├── scripts/ → symlink     # render.js (Puppeteer 렌더러)
├── config.json → symlink  # 템플릿 설정
├── workspace/             # 런타임 작업 공간 (slides.json 등)
├── output/                # 생성된 PNG 출력
├── vite.config.ts
├── tsconfig.json
├── tsconfig.main.json
└── tsconfig.renderer.json
```

## 구현 현황

- [x] Phase 1: Electron + React + TypeScript 기반 구축
- [x] Phase 2: 템플릿 시스템 Symlink 연동
- [x] Phase 3: Claude Agent SDK 연동 및 IPC 파이프라인
- [x] Phase 4: React UI 구현 (3패널 레이아웃, 채팅, 미리보기, 편집)
- [x] Phase 5: 내보내기 및 UX 개선
- [ ] Phase 6: 배포 준비

## 전제 조건

- Node.js 18+
- Claude Code 구독 활성화 (AI 카드뉴스 생성용)
- `../instagram-card-news/` 프로젝트 (symlink 대상)
