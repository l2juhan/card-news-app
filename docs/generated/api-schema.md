# IPC Schema (auto-generated)

> ⚠️ 자동 생성. 직접 수정 금지. `src/shared/types.ts`, `src/main/ipc.ts`, `src/preload/index.ts`에서 추출.
> 마지막 갱신: 2026-04-28 (하네스 도입 베이스라인 — Phase 1 분석 결과 기반)

이 프로젝트는 외부 HTTP API를 호출하지 않는다. 모든 외부 통신은 **Electron IPC 채널**로 이루어지며, 이 문서가 그 스키마이다.

## Renderer → Main (invoke)

| 채널 | 페이로드 타입 | 응답 | 설명 |
|------|--------------|------|------|
| `card-news:generate` | `GenerateRequest { topic: string; style: StyleName; slideCount: number; tone?: Tone; accentColor?: string }` | `void` (결과는 `card-news:generated`로 broadcast) | AI 카드뉴스 생성 시작 |
| `card-news:edit` | `EditRequest { slideNumber: number; instruction: string }` | `void` | AI 기반 슬라이드 편집 |
| `card-news:direct-edit` | `DirectEditRequest { slideNumber: number; changes: Partial<Slide> }` | `void` | AI 미호출 직접 편집 (필드 갱신 + 재렌더링) |
| `card-news:change-style` | `StyleName` (string) | `void` | 전체 슬라이드 스타일 일괄 변경 |
| `card-news:reorder-slides` | `number[]` (새 순서) | `void` | 슬라이드 순서 변경 |
| `card-news:export` | `ExportRequest { format: 'png'; resolution: { width: number; height: number } }` | `void` (결과는 `card-news:exported`로 broadcast) | PNG 일괄 내보내기 |
| `card-news:get-styles` | (없음) | `Record<StyleName, StyleConfig>` | 사용 가능한 스타일 메타데이터 조회 |
| `app:check-updates` | (없음) | `void` | 자동 업데이트 확인 트리거 |
| `app:install-update` | (없음) | `void` | 다운로드된 업데이트 설치 |

## Main → Renderer (send / on)

| 채널 | 페이로드 타입 | 설명 |
|------|--------------|------|
| `card-news:progress` | `ProgressEvent { status: string; percent: number }` | 생성/편집 진행률 |
| `card-news:generated` | `CardNewsResult { slides: Slide[]; imagePaths: string[] }` | 생성 완료 결과 |
| `card-news:slide-updated` | `(slideNumber: number, imagePath: string)` (2 args) | 단일 슬라이드 갱신 (편집 후) |
| `card-news:slides-rerendered` | `string[]` (imagePaths) | 전체 재렌더링 완료 (스타일/색 변경 시) |
| `card-news:exported` | `string[]` (저장된 PNG 경로) | 내보내기 완료 |
| `card-news:error` | `ErrorEvent { message: string; code?: string }` | 에러 broadcast (renderer에서 채팅 메시지로 표시) |
| `app:update-status` | `UpdateStatusEvent` (5 kinds union) | 업데이트 lifecycle (`checking` / `available` / `downloading` / `downloaded` / `error`) |

## 관련 타입 — `src/shared/types.ts`

```typescript
// 슬라이드 타입 (15개 + RN 전용 6개)
type SlideType =
  | 'cover' | 'content' | 'content-badge' | 'content-stat'
  | 'content-quote' | 'content-image' | 'content-steps'
  | 'content-list' | 'content-split' | 'content-highlight'
  | 'content-grid' | 'content-bigdata' | 'content-fullimage'
  | 'content-code' | 'cta'
  | 'content-install' | 'content-table' | 'content-code-desc'
  | 'content-grid-table' | 'content-compare-image';

interface Slide {
  type: SlideType;
  headline: string;
  body?: string;
  emphasis?: string;
  subtext?: string;
  image_url?: string;
  code_body?: string;
  // 기타 타입별 필드
}

type StyleName =
  | 'aws' | 'blueprint' | 'bold' | 'clean' | 'cs'
  | 'elegant' | 'linux' | 'magazine' | 'minimal'
  | 'premium' | 'rn' | 'toss';

interface StyleConfig {
  name: string;
  accent_color: string;
  background: string;
  preview_image?: string;
}

type Tone = 'professional' | 'casual' | 'energetic';
type NavView = 'create' | 'history' | 'settings';
```

## 변경 절차 (4곳 동기화)

새 IPC 채널 추가/변경 시 **반드시** 4곳을 같이 업데이트한 뒤 이 문서 갱신:
1. `src/shared/types.ts` — 페이로드 타입
2. `src/main/ipc.ts` — `ipcMain.handle` / `webContents.send`
3. `src/preload/index.ts` — `contextBridge` 노출
4. `src/renderer/hooks/useIpc.ts` 또는 호출부 — `window.api.*`

QA 에이전트는 위 4곳의 shape이 일치하는지 자동 검증한다.
