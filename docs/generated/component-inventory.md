# Component Inventory (auto-generated)

> ⚠️ 자동 생성. 직접 수정 금지. `src/renderer/components/` 스캔 결과.
> 마지막 갱신: 2026-04-28 (하네스 도입 베이스라인)

분류 기호: **P** = Pure Presentation (props만 받음) · **C** = Container (store/hook/IPC 호출) · **Mixed** = 혼합 (개선 대상)

## 컴포넌트 (12개)

| 컴포넌트 | 경로 | 분류 | props 수 | 사용처 (직속 부모) | 비고 |
|---|---|---|---|---|---|
| `App` | src/renderer/App.tsx | C | 0 | (root) | 전역 useIpc + useKeyboard 등록, 3-column 레이아웃 |
| `SideNav` | components/SideNav.tsx | C | 0 | App | useCardNewsStore 4회, 좌측 네비 |
| `ChatPanel` | components/ChatPanel.tsx | C | 0 | App | useCardNewsStore + useChat |
| `ChatMessage` | components/ChatMessage.tsx | **P** | 2 (message, onRetry) | ChatPanel | 순수 메시지 버블 |
| `ChatInput` | components/ChatInput.tsx | C | 0 | ChatPanel | useCardNewsStore 5회, 입력 + 전송 |
| `LoadingIndicator` | components/LoadingIndicator.tsx | C | 0 | ChatPanel / PreviewPanel | useCardNewsStore (progress) |
| `PreviewPanel` | components/PreviewPanel.tsx | C | 0 | App | useCardNewsStore (slides) |
| `PhoneMockup` | components/PhoneMockup.tsx | C | 0 | PreviewPanel | useCardNewsStore 3회, 미리보기 프레임 |
| `SlideNavigator` | components/SlideNavigator.tsx | C | 0 | PreviewPanel | useCardNewsStore 3회, « < N/M > » |
| `SlideEditor` | components/SlideEditor.tsx | C | 0 | PreviewPanel | useCardNewsStore 6회, window.api.directEdit |
| `SlideGrid` | components/SlideGrid.tsx | C | 0 | PreviewPanel | useCardNewsStore 4회, @dnd-kit 통합 |
| `ColorPicker` | components/ColorPicker.tsx | **P** | 2 (value, onChange) | SlideEditor / SideNav 등 | 순수 색상 UI |
| `ExportButton` | components/ExportButton.tsx | C | 0 | App / SideNav | useCardNewsStore 3회 + useExport |
| `UpdateNotification` | components/UpdateNotification.tsx | C | 0 | App | window.api.onUpdateStatus 리스너 + useState |

## 통계

- 전체: 14개 (App 포함, App 제외 시 13개)
- Container: 12개 (86%)
- Pure Presentation: 2개 (14%) — `ChatMessage`, `ColorPicker`
- 150줄 초과(분리 후보 추정): `SlideEditor`, `SlideGrid`, `ChatPanel` (정확한 줄 수는 `/health`에서 확인)

## 커스텀 훅 (4개)

| 훅 | 경로 | 책임 |
|---|---|---|
| `useChat` | hooks/useChat.ts | 생성/편집 IPC + store 자동 관리 |
| `useExport` | hooks/useExport.ts | PNG 내보내기 IPC + 중복 호출 방지 |
| `useIpc` | hooks/useIpc.ts | Main→Renderer 이벤트 일괄 등록 + styles 초기 로드 |
| `useKeyboard` | hooks/useKeyboard.ts | 전역 단축키 (Cmd+E, Esc) |

## Store (1개)

| Store | 경로 | state 필드 | actions |
|---|---|---|---|
| `useCardNewsStore` | stores/useCardNewsStore.ts | 13개 (currentView, topic, style, slideCount, slides, imagePaths, accentColor, selectedSlide, isGenerating, isEditing, progress, styles, messages) | 14개 |

persist: 미사용 (메모리 only) · 단일 store 정책 유지

## P/C 분리 진척 추적

| 시점 | Pure P | Container | Pure 비율 |
|------|--------|-----------|-----------|
| 2026-04-28 (베이스라인) | 2 | 12 | 14% |

목표: 신규 컴포넌트는 Pure 비율 점진적 상승. 기존 큰 Container의 분리 우선순위는 줄 수 기준.
