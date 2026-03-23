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

## 프로젝트 구조

```
card-news-app/
├── src/
│   ├── main/           # Electron Main Process
│   │   └── index.ts    # 앱 진입점, BrowserWindow 생성
│   ├── preload/        # Preload 스크립트
│   │   └── index.ts    # contextBridge API 노출
│   ├── renderer/       # React Renderer Process
│   │   ├── index.html  # Vite 진입 HTML
│   │   ├── main.tsx    # React 진입점
│   │   └── App.tsx     # 메인 레이아웃
│   └── shared/         # Main/Renderer 공유 타입
├── templates/          # HTML 카드뉴스 템플릿 (예정)
├── vite.config.ts      # Renderer 빌드 설정
├── tsconfig.json       # TypeScript 기본 설정
├── tsconfig.main.json  # Main Process TS 설정
└── tsconfig.renderer.json  # Renderer TS 설정
```

## 전제 조건

- Node.js 18+
- Claude Code 구독 활성화 (AI 카드뉴스 생성용)
