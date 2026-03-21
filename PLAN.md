# Card News Generator - 구현 계획서

## 1. 플랫폼 결정

### 비교 분석

| 기준 | Electron | Web App | Tauri |
|------|----------|---------|-------|
| Claude Agent SDK 호환 | O (Node.js 내장) | X (로컬 CLI spawn 필요) | △ (CLI subprocess는 가능하나 SDK 미지원) |
| Puppeteer 로컬 실행 | O | X (서버 필요) | △ |
| 파일시스템 접근 | O (직접) | X | O |
| 번들 크기 | ~200MB | 0 (브라우저) | ~20MB |
| 배포 용이성 | DMG/NSIS 배포 | 즉시 접근 | DMG/MSI 배포 |
| 크로스 플랫폼 | macOS/Windows/Linux | 모든 브라우저 | macOS/Windows/Linux |

### 결론: Electron

`@anthropic-ai/claude-agent-sdk`는 Claude Code CLI(Bun 네이티브 바이너리)를 subprocess로 spawn하고 stdin/stdout NDJSON으로 통신하는 Node.js 라이브러리다.
SDK가 CLI 바이너리를 내장하고 있어 별도 설치가 불필요하며, TypeScript Agent SDK를 직접 import하려면 Node.js 런타임이 필요하므로 Electron이 최적의 선택이다.
웹 앱은 구조적으로 불가능하고, Tauri는 CLI subprocess 방식으로 가능하지만 SDK의 typed interface, hooks, permission 콜백을 사용할 수 없다.
참고: Anthropic의 Claude Desktop 앱 자체도 Electron으로 구축되어 있다.

---

## 2. 기술 스택

| 항목 | 기술 | 선정 이유 |
|------|------|-----------|
| 프레임워크 | **Electron** | Claude Agent SDK (Node.js) 직접 import, SDK가 CLI 바이너리 내장 |
| 프론트엔드 | **React 18 + TypeScript** | 컴포넌트 기반 UI, 타입 안정성 |
| 빌드 도구 | **Vite** (renderer) + **esbuild** (main) | 빠른 HMR, Electron 호환 |
| 카드 렌더링 | **Puppeteer** | instagram-card-news에서 검증된 HTML→PNG 파이프라인 |
| Claude 연동 | **@anthropic-ai/claude-agent-sdk** | API 비용 없이 Claude Code 구독으로 동작, CLI 바이너리 내장 |
| 스타일링 | **Tailwind CSS** | 빠른 UI 개발, 유틸리티 기반 |
| 상태관리 | **Zustand** | 경량, 보일러플레이트 최소 |
| 패키징 | **electron-builder** | DMG/NSIS 빌드, 코드 서명, 자동 업데이트 |

---

## 3. 참조 프로젝트 재사용 계획

`../instagram-card-news/`에서 다음을 이식한다:

| 재사용 대상 | 원본 경로 | 이식 방법 |
|-------------|-----------|-----------|
| HTML 템플릿 (189개) | `templates/` (11개 스타일) | 그대로 복사 |
| 템플릿 설정 | `config.json` | 복사 후 Electron 경로 조정 |
| 렌더링 엔진 | `scripts/render.js` | TypeScript로 변환 → `src/main/renderer.ts` |
| 플레이스홀더 치환 | render.js 내 `applyPlaceholders()` | TypeScript로 변환 → `src/main/template.ts` |

### 재사용하지 않는 것
- CLAUDE.md (워크플로우 문서) → 참고만, 새로 작성
- workspace/ (런타임 데이터) → Electron 앱 내부에서 관리
- skill-package/ (CLI 스킬 배포) → 불필요

---

## 4. 프로젝트 구조

```
card-news-app/
├── package.json
├── tsconfig.json
├── tsconfig.main.json          # Main Process용 TS 설정
├── tsconfig.renderer.json      # Renderer Process용 TS 설정
├── electron-builder.yml        # 패키징 설정
├── vite.config.ts              # Renderer 빌드
├── CLAUDE.md
├── SRS.md
├── PLAN.md
│
├── .claude/
│   └── commands/
│       ├── generate.md         # 카드뉴스 생성 스킬
│       └── edit.md             # 카드뉴스 수정 스킬
│
├── src/
│   ├── main/                   # ─── Electron Main Process ───
│   │   ├── index.ts            # 앱 진입점, BrowserWindow 생성
│   │   ├── ipc.ts              # IPC 핸들러 등록 (generate, edit, export)
│   │   ├── claude.ts           # Claude Code SDK 래퍼
│   │   ├── renderer.ts         # Puppeteer HTML→PNG 렌더링
│   │   └── template.ts         # 템플릿 로드 + 플레이스홀더 치환
│   │
│   ├── preload/
│   │   └── index.ts            # contextBridge로 IPC API 노출
│   │
│   ├── renderer/               # ─── React Renderer Process ───
│   │   ├── index.html
│   │   ├── main.tsx            # React 진입점
│   │   ├── App.tsx             # 메인 레이아웃
│   │   ├── components/
│   │   │   ├── TopicInput.tsx       # 주제 입력 폼
│   │   │   ├── StyleSelector.tsx    # 11개 스타일 프리셋 선택
│   │   │   ├── SlideGrid.tsx        # 슬라이드 썸네일 그리드
│   │   │   ├── SlidePreview.tsx     # 슬라이드 확대 모달 (이전/다음 탐색)
│   │   │   ├── EditInput.tsx        # 수정 요청 텍스트 입력
│   │   │   ├── ExportButton.tsx     # PNG 내보내기 (전체/개별)
│   │   │   └── LoadingOverlay.tsx   # 생성/수정 중 로딩 UI
│   │   ├── stores/
│   │   │   └── useCardNewsStore.ts  # Zustand 전역 상태
│   │   ├── hooks/
│   │   │   ├── useIpc.ts            # IPC 통신 훅
│   │   │   └── useExport.ts         # 내보내기 로직 훅
│   │   └── styles/
│   │       └── global.css           # Tailwind + 글로벌 스타일
│   │
│   └── shared/
│       └── types.ts            # Main/Renderer 공유 타입 정의
│
├── templates/                  # HTML 카드뉴스 템플릿 (instagram-card-news에서 이식)
│   ├── minimal/    (14개)
│   ├── bold/       (14개)
│   ├── elegant/    (14개)
│   ├── premium/    (14개)
│   ├── toss/       (14개)
│   ├── magazine/   (14개)
│   ├── clean/      (14개)
│   ├── blueprint/  (14개)
│   ├── aws/        (14개)
│   ├── rn/         (20개)
│   ├── cs/         (14개)
│   └── linux/      (15개)
│
├── config.json                 # 템플릿 설정 (스타일별 색상, 디멘션)
│
└── output/                     # 런타임 생성 디렉토리
    └── exported/               # PNG 내보내기 저장소
```

---

## 5. 단계별 구현 계획

### Phase 1: 프로젝트 셋업 및 Electron 기반 구축

**목표:** Electron + React + TypeScript 개발 환경 완성, 빈 윈도우가 뜨는 상태까지

**작업 목록:**
- [ ] `npm init` → package.json 생성
- [ ] 핵심 의존성 설치
  - electron, react, react-dom, typescript
  - vite, @vitejs/plugin-react
  - electron-builder
- [ ] TypeScript 설정 (tsconfig.json, tsconfig.main.json, tsconfig.renderer.json)
- [ ] `src/main/index.ts` - Electron 앱 진입점
  - BrowserWindow 생성 (1200×800)
  - 개발 모드: localhost 로드 / 프로덕션: 빌드된 HTML 로드
- [ ] `src/preload/index.ts` - contextBridge 기본 구조
- [ ] `src/renderer/index.html` + `main.tsx` + `App.tsx` - React 기본 구조
- [ ] `vite.config.ts` - Renderer 빌드 설정 (Electron 호환)
- [ ] package.json scripts 설정
  - `dev`: Vite dev server + Electron 동시 실행
  - `build`: Renderer 빌드 + Main 컴파일
- [ ] 핫 리로드 동작 확인

**완료 기준:** `npm run dev`로 Electron 윈도우에 React 앱이 표시됨

---

### Phase 2: 템플릿 시스템 이식

**목표:** instagram-card-news의 템플릿과 렌더링 파이프라인을 Electron에 통합

**작업 목록:**
- [ ] `../instagram-card-news/templates/` → `templates/` 디렉토리 전체 복사 (11개 스타일)
- [ ] `../instagram-card-news/config.json` → `config.json` 복사 및 경로 조정
- [ ] `src/shared/types.ts` 작성
  - Slide, SlideType, StyleConfig, CardNewsProject 등 핵심 타입 정의
- [ ] `src/main/template.ts` 구현
  - 템플릿 HTML 파일 로드
  - `applyPlaceholders()` 함수 ({{placeholder}} → 실제 값 치환)
  - 이미지 경로 → base64 data URL 변환
  - `<br>` 변환, HTML 이스케이프 처리
- [ ] `src/main/renderer.ts` 구현
  - Puppeteer 브라우저 인스턴스 관리 (앱 수명주기에 맞춤)
  - `renderSlides(slides, style, options)` → PNG 파일 배열 생성
  - `renderSingleSlide(slide, style, options)` → 단일 PNG 생성
  - 뷰포트 크기 설정 (1080×1350 기본, 스타일별 오버라이드)
- [ ] 통합 테스트: 샘플 slides.json으로 PNG 생성 확인

**완료 기준:** Main Process에서 프로그래밍 방식으로 slides.json → PNG 변환 동작

---

### Phase 3: Claude Agent SDK 연동

**목표:** 주제 입력 → Claude가 slides.json 생성 → 렌더링까지 전체 파이프라인 동작

**작업 목록:**
- [ ] `@anthropic-ai/claude-agent-sdk` 설치
- [ ] `.claude/commands/generate.md` 스킬 작성
  - 카드뉴스 디자이너 역할 정의
  - 슬라이드 구성 규칙 (표지, 본문, CTA)
  - JSON 출력 형식 명세 (slides.json 스키마)
  - 스타일별 가이드라인
- [ ] `.claude/commands/edit.md` 스킬 작성
  - 기존 slides.json을 읽고 특정 슬라이드 수정
  - 수정 후 변경된 슬라이드만 반환
- [ ] `src/main/claude.ts` 구현
  - `generateCardNews(topic, style, slideCount)` → Slide[]
  - `editSlide(slides, slideNumber, instruction)` → Slide
  - 스트리밍 진행 상태 콜백
  - 에러 핸들링 (SDK 초기화 실패, 연결 실패 등)
  - systemPrompt 명시적 설정 (Agent SDK는 기본 시스템 프롬프트 미적용)
  - settingSources: ['project'] 명시 (CLAUDE.md, 스킬 파일 로딩)
- [ ] `src/main/ipc.ts` 구현
  - `card-news:generate` 핸들러 → claude.ts → renderer.ts → 결과 반환
  - `card-news:edit` 핸들러 → claude.ts → 단일 슬라이드 재렌더링
  - `card-news:get-styles` 핸들러 → config.json 읽어 스타일 목록 반환
  - 진행 상태 이벤트 Renderer로 전달
- [ ] `src/preload/index.ts` 업데이트
  - contextBridge로 IPC API 노출 (window.api.generate, window.api.edit 등)
- [ ] 전체 파이프라인 테스트: 주제 입력 → Claude 생성 → PNG 출력

**완료 기준:** IPC를 통해 Renderer에서 카드뉴스 생성/수정 요청 → PNG 결과 수신 가능

**IPC 프로토콜 상세:**
```
Renderer → Main (invoke):
  card-news:generate(topic: string, style: string, slideCount: number) → void
  card-news:edit(slideNumber: number, instruction: string) → void        # AI 편집
  card-news:direct-edit(slideNumber: number, changes: Partial<Slide>) → void  # 직접 편집 (AI 미호출)
  card-news:change-style(newStyle: string) → void                        # 스타일 일괄 변경
  card-news:reorder-slides(newOrder: number[]) → void                    # 순서 변경
  card-news:export(format: 'png', resolution: Resolution) → void
  card-news:get-styles() → StyleConfig[]

Main → Renderer (event):
  card-news:progress({ status: string, percent: number })
  card-news:generated({ slides: Slide[], imagePaths: string[] })
  card-news:slide-updated({ slideNumber: number, imagePath: string })
  card-news:slides-rerendered({ imagePaths: string[] })                  # 일괄 재렌더링 완료
  card-news:exported({ paths: string[] })
  card-news:error({ message: string, code: string })
```

---

### Phase 4: React UI 구현

**목표:** 핵심 UI 컴포넌트 완성, 실제 사용 가능한 인터페이스

**작업 목록:**

#### 4-1. 기반 설정
- [ ] Tailwind CSS 설치 및 설정
- [ ] `src/renderer/styles/global.css` - 기본 스타일, 폰트 로드 (Pretendard)
- [ ] `src/renderer/stores/useCardNewsStore.ts` - Zustand 스토어
  ```
  상태: topic, style, slideCount, slides[], imagePaths[],
        selectedSlide, isGenerating, isEditing, progress
  액션: generate, edit, selectSlide, reorderSlides, setStyle
  ```

#### 4-2. 좌측 사이드바 (SideNav)
- [ ] `SideNav.tsx` - 좌측 네비게이션 메뉴
  - 카드뉴스 만들기 (새 프로젝트)
  - 작업 목록 (이전 프로젝트 목록)
  - 설정 (스타일 기본값, 해상도 등)

#### 4-3. 중앙 패널 - 대화형 채팅 (ChatPanel)
- [ ] `ChatPanel.tsx` - Claude Code 대화 인터페이스
  - 채팅 메시지 목록 (스크롤 영역)
  - 사용자 메시지 / AI 응답 버블 구분
  - 생성 중 스트리밍 텍스트 표시
- [ ] `ChatMessage.tsx` - 개별 메시지 컴포넌트
  - 사용자 메시지: 주제 입력, 수정 요청 등
  - AI 메시지: 생성 완료 알림, 수정 결과 등
- [ ] `ChatInput.tsx` - 하단 메시지 입력 영역
  - 텍스트 입력 (자연어: "AI 트렌드 주제로 7장 만들어줘", "3번 배경 파란색으로")
  - 전송 버튼 / Enter 키 전송
  - 스타일/장수 선택 옵션 (첫 생성 시)
- [ ] `LoadingIndicator.tsx` - 생성/수정 중 타이핑 인디케이터

#### 4-4. 우측 패널 - Instagram 미리보기 (PreviewPanel)
- [ ] `PreviewPanel.tsx` - 우측 미리보기 컨테이너
- [ ] `PhoneMockup.tsx` - 아이폰 프레임 목업
  - 상단: 시간, 배터리 등 상태바
  - Instagram UI 재현: 프로필 아이콘 + 계정명, 더보기(⋯) 버튼
  - 카드뉴스 이미지 렌더링 영역 (선택된 슬라이드 PNG 표시)
  - 하단 Instagram 액션바: 좋아요(♡), 댓글(💬), 공유(✈), 저장(🔖)
  - 좋아요 수 표시
  - 캐러셀 닷 인디케이터 (● ○ ○ ○ ○)
  - Instagram 하단 탭바: 홈, 검색, 만들기, 릴스, 프로필
- [ ] `SlideNavigator.tsx` - 폰 목업 하단 슬라이드 네비게이션
  - `« < 2/7 > »` 형태의 페이지네이션
  - 처음/이전/현재번호/전체수/다음/마지막 이동
  - 키보드 화살표 키 지원

#### 4-5. 우측 패널 - 직접 편집 (SlideEditor)

AI를 호출하지 않고 JSON 값만 수정 → Puppeteer 재렌더링으로 즉시 반영 (1~2초).

- [ ] `SlideEditor.tsx` - 인라인 편집 패널 (폰 목업 하단 또는 토글)
  - **텍스트 편집**: headline, body, subtext, emphasis 등 필드별 입력
  - **색상 편집**: accent_color 컬러 피커
  - **스타일 변경**: 드롭다운으로 11개 스타일 전환 (전체 슬라이드 일괄)
  - **슬라이드 타입 변경**: 현재 슬라이드의 type 전환 (content → content-stat 등)
  - **슬라이드 관리**: 추가 / 삭제 / 순서 변경 (드래그 앤 드롭)
  - "적용" 버튼 → JSON 수정 → IPC로 재렌더링 요청 → PNG 갱신
- [ ] `ColorPicker.tsx` - accent_color 선택 컴포넌트
  - 프리셋 색상 팔레트 + 커스텀 HEX 입력
- [ ] `src/main/ipc.ts`에 직접 편집용 핸들러 추가
  - `card-news:direct-edit(slideNumber, changes)` → JSON 수정 → 재렌더링 (AI 미호출)
  - `card-news:change-style(newStyle)` → 전체 슬라이드 스타일 교체 → 일괄 재렌더링
  - `card-news:reorder-slides(newOrder)` → 순서 변경 → 번호 갱신 → 재렌더링

**AI 편집 vs 직접 편집 구분:**
| 작업 | 방식 | 소요 시간 |
|------|------|-----------|
| 텍스트 수정 (headline, body 등) | 직접 편집 (JSON) | 1~2초 |
| 색상 변경 (accent_color) | 직접 편집 (JSON) | 1~2초 |
| 스타일 전환 (clean → bold) | 직접 편집 (템플릿 교체) | 2~3초 |
| 슬라이드 타입 변경 | 직접 편집 (JSON) | 1~2초 |
| 슬라이드 순서/추가/삭제 | 직접 편집 (배열 조작) | 1~2초 |
| 내용 재작성/톤 변경 | AI 채팅 (Claude) | 10~30초 |
| 새 슬라이드 내용 생성 | AI 채팅 (Claude) | 10~30초 |
| 복잡한 레이아웃 변경 요청 | AI 채팅 (Claude) | 10~30초 |

#### 4-6. IPC 훅
- [ ] `src/renderer/hooks/useIpc.ts`
  - window.api를 래핑하는 React 훅
  - IPC 이벤트 리스너 등록/해제 (useEffect)
- [ ] `src/renderer/hooks/useChat.ts`
  - 채팅 메시지 관리 (send, receive, streaming)

**완료 기준:** 채팅으로 생성 요청 → 대화 흐름으로 결과 수신 → 폰 목업에서 미리보기 → 직접 편집으로 즉시 수정 + 채팅으로 AI 수정 요청 모두 동작

**UI 레이아웃:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  Card News Generator                                      [─][□][×] │
├────────┬───────────────────────────────┬─────────────────────────────┤
│        │                               │                             │
│  사이드 │  대화형 채팅 패널              │  Instagram 미리보기 패널     │
│  메뉴   │                               │                             │
│        │  ┌─────────────────────────┐  │  ┌───────────────────────┐  │
│ ┌────┐ │  │ 🤖 어떤 카드뉴스를       │  │  │  ┌─────────────────┐  │  │
│ │ 📝 │ │  │    만들어 드릴까요?      │  │  │  │  9:41       ▎▐█  │  │  │
│ │만들기│ │  └─────────────────────────┘  │  │  │  (D) 개발자의디자인│  │  │
│ └────┘ │                               │  │  │                   │  │  │
│ ┌────┐ │  ┌─────────────────────────┐  │  │  │  ┌─────────────┐ │  │  │
│ │ 📋 │ │  │ 👤 AI 트렌드 2025       │  │  │  │  │             │ │  │  │
│ │작업  │ │  │    주제로 7장 만들어줘   │  │  │  │  │  카드뉴스   │ │  │  │
│ │목록  │ │  └─────────────────────────┘  │  │  │  │  이미지     │ │  │  │
│ └────┘ │                               │  │  │  │             │ │  │  │
│        │  ┌─────────────────────────┐  │  │  │  └─────────────┘ │  │  │
│ ┌────┐ │  │ 🤖 clean 스타일로 7장    │  │  │  │  ♡ 💬 ✈     🔖 │  │  │
│ │ ⚙️ │ │  │    생성했습니다!         │  │  │  │  좋아요 1,234개  │  │  │
│ │설정  │ │  │    수정이 필요하면       │  │  │  │  ● ○ ○ ○ ○ ○ ○ │  │  │
│ └────┘ │  │    말씀해주세요          │  │  │  │  ┌─┬─┬─┬─┬─┐  │  │  │
│        │  └─────────────────────────┘  │  │  │  │⌂│🔍│⊕│▦│👤│  │  │  │
│        │                               │  │  │  └─┴─┴─┴─┴─┘  │  │  │
│        │  ┌─────────────────────────┐  │  │  └───────────────────────┘  │
│        │  │ 👤 3번 배경 파란색으로   │  │  │                             │
│        │  └─────────────────────────┘  │  │   « ‹  2 / 7  › »          │
│        │                               │  │                             │
│        │  ┌─────────────────────┐      │  │  ┌───────────────────────┐  │
│        │  │ 메시지 입력...  [전송]│      │  │  │ 📝 직접 편집           │  │
│        │  └─────────────────────┘      │  │  │ 제목: [인간 최후의..  ] │  │
│        │                               │  │  │ 본문: [알파고 승, 전..] │  │
│        │                               │  │  │ 강조색: [■ #6C5CE7 🎨] │  │
│        │                               │  │  │ 스타일: [bold ▼]       │  │
│        │                               │  │  │ [ 적용 ]  [ 내보내기 ] │  │
│        │                               │  │  └───────────────────────┘  │
├────────┴───────────────────────────────┴─────────────────────────────┤
```

---

### Phase 5: 내보내기 및 UX 개선

**목표:** PNG 내보내기 완성, 에러 처리, 드래그 앤 드롭, 스트리밍 진행률

**작업 목록:**

#### 5-1. 내보내기
- [ ] `ExportButton.tsx` 구현
  - 전체 슬라이드 PNG 일괄 내보내기
  - 개별 슬라이드 PNG 저장
  - 저장 위치 선택 다이얼로그 (Electron dialog.showSaveDialog)
- [ ] `card-news:export` IPC 핸들러
  - 해상도 옵션: 1080×1080 (정사각형), 1080×1350 (4:5)
  - 파일명 규칙: `{topic}_slide_{n}.png`
- [ ] `src/renderer/hooks/useExport.ts` 훅 구현

#### 5-2. UX 개선
- [ ] 슬라이드 드래그 앤 드롭 순서 변경 (SlideGrid)
  - react-beautiful-dnd 또는 dnd-kit 사용
  - 순서 변경 시 슬라이드 번호 자동 갱신
- [ ] 생성 중 스트리밍 진행 표시
  - Claude SDK의 스트리밍 이벤트를 IPC로 전달
  - "리서치 중..." → "카피 작성 중..." → "렌더링 중..." 단계 표시
- [ ] 에러 핸들링 개선
  - Claude Code 미설치 감지 → 설치 안내 다이얼로그
  - 네트워크 연결 실패 → 재시도 버튼
  - Puppeteer 렌더링 실패 → 해당 슬라이드 표시
- [ ] 키보드 단축키
  - `Cmd+Enter`: 생성하기
  - `Cmd+E`: 내보내기
  - `Esc`: 모달 닫기
  - `←/→`: 슬라이드 탐색

**완료 기준:** 최종 사용자가 불편함 없이 생성 → 편집 → 내보내기 플로우를 완료할 수 있음

---

### Phase 6: 배포 준비

**목표:** macOS/Windows용 설치 패키지 생성 및 배포 파이프라인

**작업 목록:**

#### 6-1. 패키징 설정
- [ ] `electron-builder.yml` 설정
  ```yaml
  appId: com.cardnews.generator
  productName: Card News Generator
  directories:
    output: dist
  files:
    - src/main/**/*
    - src/preload/**/*
    - templates/**/*
    - config.json
  mac:
    category: public.app-category.graphics-design
    target: [dmg, zip]
  win:
    target: [nsis]
  ```
- [ ] 앱 아이콘 제작 (1024×1024 PNG → .icns + .ico 변환)

#### 6-2. macOS 배포
- [ ] 코드 서명 (Apple Developer ID)
- [ ] 공증 (Notarization)
- [ ] DMG 빌드 테스트
- [ ] Universal Binary (Intel + Apple Silicon)

#### 6-3. Windows 배포
- [ ] NSIS 인스톨러 빌드
- [ ] 코드 서명 (선택)
- [ ] 설치/제거 테스트

#### 6-4. 자동 업데이트
- [ ] electron-updater 설정
- [ ] GitHub Releases 연동
- [ ] 업데이트 알림 UI

#### 6-5. CI/CD
- [ ] GitHub Actions 워크플로우
  - PR 시 빌드 테스트
  - 태그 push 시 자동 빌드 + Release 배포

**완료 기준:** GitHub Release에 macOS DMG + Windows NSIS 설치 파일 게시

---

## 6. 핵심 데이터 흐름

```
사용자 입력 (주제, 스타일)
    │
    ▼
[Renderer] TopicInput → useCardNewsStore.generate()
    │
    ▼ IPC invoke
[Main] ipc.ts → claude.ts → Claude Agent SDK
    │                           │
    │  progress 이벤트          ▼
    │◄──────────────── Claude Code가 slides.json 생성
    │
    ▼
[Main] renderer.ts → Puppeteer
    │  각 슬라이드 HTML 로드 + 플레이스홀더 치환 + 스크린샷
    │
    ▼
[Main] PNG 파일들 저장 (output/)
    │
    ▼ IPC event
[Renderer] SlideGrid에 썸네일 표시
    │
    ▼ 사용자 클릭
[Renderer] SlidePreview 모달 → EditInput
    │
    ▼ 수정 요청 (IPC invoke)
[Main] claude.ts → 해당 슬라이드만 수정 → 재렌더링
    │
    ▼ IPC event
[Renderer] 해당 슬라이드 썸네일 업데이트
```

---

## 7. 리스크 및 대응

| 리스크 | 영향 | 대응 방안 |
|--------|------|-----------|
| Claude Agent SDK가 Electron Main Process에서 동작하지 않을 수 있음 | 치명적 | Phase 3 초반에 SDK 호출 테스트를 최우선 수행. 실패 시 `claude -p` CLI를 child_process로 직접 spawn (--output-format stream-json) |
| Puppeteer 번들 크기 (~300MB) | 배포 크기 증가 | puppeteer-core + 시스템 Chromium 사용 검토 |
| macOS 코드 서명 비용 (연 $99) | 배포 장벽 | 초기에는 서명 없이 배포, 사용자에게 "확인되지 않은 개발자" 안내 |
| 템플릿 HTML이 Puppeteer 외부에서 다르게 렌더링될 수 있음 | 미리보기 불일치 | iframe 미리보기는 참고용으로만 사용, 최종 결과는 항상 Puppeteer 렌더링 |
| Claude 생성 결과의 일관성 부족 | UX 품질 저하 | .claude/commands/ 스킬에 엄격한 JSON 스키마 명세, 후처리 검증 |

---

## 8. 전제 조건

- 사용자의 **Claude Code 구독**이 활성화되어야 함 (SDK가 CLI 바이너리를 내장하므로 별도 설치는 불필요)
- **Node.js 18+** 환경
- macOS 배포 시 **Apple Developer 계정** (코드 서명용, Phase 6)
- 인터넷 연결 필수 (Claude Code, Google Fonts CDN)
