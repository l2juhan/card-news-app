# FRONTEND.md

> 역할: card-news-app **현재 코드에서 추출한** 프론트엔드 컨벤션. 신규 코드는 이 패턴을 따르고, 위반은 PostToolUse Hook + QA 에이전트가 잡는다.

## 1. 폴더/파일 구조

```
src/
├── main/        # Electron Main 프로세스 (Node 컨텍스트)
├── preload/     # contextBridge 브리지
├── renderer/    # React + Tailwind (브라우저 컨텍스트)
│   ├── components/   # 한 파일 한 컴포넌트, PascalCase.tsx
│   ├── hooks/        # use{이름}.ts (camelCase)
│   ├── stores/       # use{도메인}Store.ts (Zustand)
│   └── styles/       # global.css (Tailwind directive)
└── shared/      # main↔renderer 공유 타입 (types.ts)
```

규칙:
- 컴포넌트 파일: `PascalCase.tsx`, 한 파일에 한 컴포넌트
- 훅 파일: `useFoo.ts`, default export 금지(named export)
- store 파일: `useFooStore.ts`, Zustand `create()` 결과를 named export
- 공유 타입은 반드시 `src/shared/types.ts`에서 import (renderer/main이 각자 정의 금지)

## 2. 컴포넌트 패턴 — Presentation / Container 분리

### Presentation (P)
- props만 받음. `useCardNewsStore`, 커스텀 훅, `window.api` 호출 **금지**
- 예시(현재 코드): `ChatMessage`, `ColorPicker`

### Container (C)
- `useCardNewsStore`, 훅, `window.api`를 사용해 상태와 IPC를 중계
- 자식 Presentation에 props로 내려보냄
- 예시(현재 코드): `ChatPanel`, `SlideEditor`, `SlideGrid`, `PreviewPanel`

### 분리 트리거
- 한 파일이 **150줄을 넘기면** 분리를 우선 검토
- Container가 너무 커지면: Container를 Container + 작은 Presentation들로 쪼갠다
- 현재 비율: Container 10 / Pure Presentation 2 → 분리할 여지가 큰 상태

## 3. 컴포넌트 내부 작성 순서
```tsx
// 1) imports (외부 → 내부 → 타입)
// 2) 타입 정의 (Props는 컴포넌트 직전)
// 3) 상수 (모듈 스코프)
// 4) 컴포넌트 함수
//    - hooks (useState → useEffect → custom hooks → useCardNewsStore)
//    - 파생값 (useMemo)
//    - 핸들러 (handleXxx, useCallback은 prop 전달 시에만)
//    - return JSX
// 5) sub-components (같은 파일에 두 개 둘 정도면 분리 검토)
```

## 4. 상태관리

| 종류 | 도구 | 예시 |
|---|---|---|
| UI 상태 (모달 열림, 입력 포커스, 토글) | `useState` | `SlideEditor` 내 편집 모드 |
| 앱 전역 상태 | `useCardNewsStore` (단일 store) | slides, messages, isGenerating |
| 서버 상태 | **없음** (외부 API 직접 호출 금지) | 모든 외부 통신은 IPC 경유 |

### Zustand 규칙
- 단일 store(`useCardNewsStore`) 유지 — 도메인 분리 금지
- 새 필드 추가 시 `resetProject` 액션에 포함 여부 검토
- persist 미사용 (앱 재시작 시 메모리 초기화) — 변경하려면 별도 결정
- selector 사용 권장: `useCardNewsStore(s => s.slides)` 형태로 리렌더 최소화

## 5. IPC 패턴 — Renderer ↔ Main

### 4곳을 항상 함께 수정
새 IPC 채널 추가/변경 시 **반드시** 4곳을 같이 업데이트:
1. `src/shared/types.ts` — 페이로드 타입
2. `src/main/ipc.ts` — `ipcMain.handle` / `webContents.send`
3. `src/preload/index.ts` — `contextBridge` 노출 함수
4. `src/renderer/hooks/useIpc.ts` 또는 호출부 — `window.api.*`

### 채널 네이밍
- prefix: `card-news:` (도메인) 또는 `app:` (앱 lifecycle)
- 동사형: `card-news:generate`, `card-news:export`, `app:check-updates`

### Renderer 측 IPC 사용 규칙
- **`electron`, `ipcRenderer` 직접 import 금지** — 항상 `window.api.*`
- 이벤트 리스너는 `useIpc` 훅에 통합 (컴포넌트 내부에서 `window.api.on*` 등록 금지)
- IPC 호출은 try/catch로 감싸 store에 에러 push 또는 채팅 메시지 추가

## 6. 커스텀 훅 책임

| 훅 | 책임 |
|---|---|
| `useChat` | 생성/편집 IPC + store 자동 관리 |
| `useExport` | PNG 내보내기 IPC + 중복 호출 방지 |
| `useIpc` | Main→Renderer 이벤트 리스너 일괄 등록 + styles 초기 로드 |
| `useKeyboard` | 전역 단축키 (Cmd+E, Esc) |

신규 훅 가이드:
- 한 훅 한 책임. 두 책임 섞이면 분리
- store에 직접 액세스 OK. `window.api`도 OK. 하지만 DOM API(`document.*`)는 가급적 컴포넌트에 둔다

## 7. 타입 안전성

- `any` **금지** (현재 0개 유지)
- 불확실하면 `unknown` + 타입 가드 또는 zod 스키마 (zod 도입 시 dep 추가 필요)
- 타입 단언(`as X`)은 가급적 회피, 타입 가드 우선
- `as unknown as X` 같은 우회 캐스팅 **금지**

## 8. 에러 처리

- IPC 핸들러 실패 → `card-news:error` 채널로 broadcast → renderer에서 채팅 메시지로 표시
- Renderer 비동기 호출 실패 → store의 `addMessage({type:'error',...})` 또는 사용자에게 표시
- silent failure 금지: catch에서 throw 안 할 거면 사용자 표시 또는 logger 기록 (logger는 Phase 후속에 도입 예정)
- `console.log` / `console.error` 신규 추가 금지 (현재 잔존: `useIpc.ts:85` — 정리 대상)

## 9. 스타일링 (Tailwind 4)

- 유틸리티 클래스 우선
- 인라인 `style={...}`은 **동적 색상**(예: `accentColor`)에만 허용
- 디자인 토큰(반복되는 색/스페이싱)은 `docs/DESIGN.md` 등록 후 사용
- `prettier-plugin-tailwindcss`가 클래스 순서 자동 정렬 (Hook이 적용)

## 10. 금지 패턴 (Hook + ESLint로 강제)

- ❌ `any` 타입
- ❌ `console.log` / `console.error` (logger 도입 전까지는 임시 허용 없음)
- ❌ Renderer에서 `require`, `process.*`, `fs`, `path`, `electron` import
- ❌ Main에서 `.tsx`, JSX, Tailwind 클래스 작성
- ❌ `.eslintrc` 무시 주석(`/* eslint-disable */`) 무분별 사용 (PR 사유 필수)
- ❌ `as unknown as X` 캐스팅
- ❌ IPC 호출을 `useIpc` 외부 컴포넌트에서 이벤트 리스너 등록

## 11. 파일 경로
- `path.join(__dirname, ...)` 또는 `app.getPath(...)` 사용
- 절대 경로 하드코딩 금지 (`/Users/...`, `C:\...`)
- 외부 레포 리소스는 `path.resolve(__dirname, '../..', 'templates')` 형태

---

> 이 파일과 실제 코드가 어긋나면 `/health`가 감지한다. 새 패턴 도입 시 이 파일을 먼저 갱신.
