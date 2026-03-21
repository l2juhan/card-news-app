# Card News Generator - Software Requirements Specification

## 1. 프로젝트 개요

### 1.1 목적
Claude Code의 스킬을 엔진으로 활용하여, GUI 기반으로 카드뉴스를 생성/편집/내보내기할 수 있는 데스크톱 앱을 만든다.

### 1.2 배경
- Claude Code 스킬/에이전트로 카드뉴스를 생성할 수 있지만, 터미널에서 텍스트로 피드백하는 UX에는 한계가 있음
- 디자인 결과물을 **시각적으로 미리보기**하고, **버튼/입력으로 수정 요청**을 보낼 수 있는 GUI가 필요
- API 비용 없이 Claude Code 구독만으로 동작하는 구조

### 1.3 기술 스택
| 항목 | 기술 |
|------|------|
| 프레임워크 | Electron |
| 프론트엔드 | React + TypeScript |
| Claude 연동 | `@anthropic-ai/claude-agent-sdk` |
| 카드뉴스 렌더링 | HTML/CSS → iframe 미리보기 |
| 이미지 내보내기 | html2canvas 또는 Puppeteer |
| 빌드 | electron-builder |

---

## 2. 시스템 아키텍처

```
┌─────────────────────────────────────────┐
│            Electron Main Process         │
│  ┌─────────────────────────────────────┐ │
│  │  Claude Code SDK                    │ │
│  │  - 스킬 호출 (카드뉴스 생성/수정)     │ │
│  │  - 프로젝트 디렉토리 기반 동작        │ │
│  └──────────────┬──────────────────────┘ │
│                 │ IPC                     │
│  ┌──────────────▼──────────────────────┐ │
│  │  Electron Renderer (React)          │ │
│  │  - 주제 입력 UI                      │ │
│  │  - 카드뉴스 미리보기 (iframe)         │ │
│  │  - 수정 요청 입력                     │ │
│  │  - 이미지 내보내기 버튼               │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         output/ (생성된 카드뉴스)         │
│  - slide-1.html                         │
│  - slide-2.html                         │
│  - ...                                  │
│  - exported/ (PNG 이미지)                │
└─────────────────────────────────────────┘
```

UI 참고: https://www.threads.com/@devdesign.kr/post/DVgLnWECgij/media?hl=ko

---

## 3. 기능 요구사항

### 3.1 카드뉴스 생성
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| F-001 | 주제/키워드를 입력하면 카드뉴스(5~10장)를 자동 생성 | 필수 |
| F-002 | 생성 중 로딩 상태 표시 (스트리밍 진행률) | 필수 |
| F-003 | 생성 완료 시 슬라이드 목록을 미리보기로 표시 | 필수 |
| F-004 | 카드뉴스 스타일 프리셋 선택 (심플, 컬러풀, 다크 등) | 선택 |

### 3.2 카드뉴스 편집
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| F-010 | 개별 슬라이드 클릭 시 확대 미리보기 | 필수 |
| F-011 | 텍스트 입력으로 수정 요청 (예: "3번 슬라이드 배경색 파란색으로") | 필수 |
| F-012 | 수정 후 해당 슬라이드만 실시간 리로드 | 필수 |
| F-013 | 슬라이드 순서 변경 (드래그 앤 드롭) | 선택 |
| F-014 | 슬라이드 추가/삭제 | 선택 |

### 3.3 내보내기
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| F-020 | 전체 슬라이드를 PNG 이미지로 일괄 내보내기 | 필수 |
| F-021 | 개별 슬라이드 PNG 저장 | 필수 |
| F-022 | 내보내기 해상도 설정 (1080x1080, 1080x1350 등) | 선택 |

### 3.4 프로젝트 관리
| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| F-030 | 이전에 만든 카드뉴스 목록 조회 | 선택 |
| F-031 | 기존 카드뉴스 불러와서 재편집 | 선택 |

---

## 4. Claude Code 연동 상세

### 4.1 SDK 호출 방식

```typescript
// Main Process (electron main)
import { query } from '@anthropic-ai/claude-agent-sdk';

async function generateCardNews(topic: string, style: string) {
  const messages = [];
  for await (const message of query({
    prompt: `카드뉴스를 만들어줘.
      주제: ${topic}
      스타일: ${style}
      슬라이드 수: 5장
      각 슬라이드는 별도의 HTML 파일로 output/ 폴더에 저장해줘.
      크기는 1080x1080px.`,
    options: {
      cwd: PROJECT_DIR,
      systemPrompt: { type: 'preset', preset: 'claude_code' },
      settingSources: ['project'],
    },
  })) {
    messages.push(message);
  }
  return messages;
}

async function editSlide(slideNumber: number, instruction: string) {
  const messages = [];
  for await (const message of query({
    prompt: `output/slide-${slideNumber}.html 파일을 수정해줘: ${instruction}`,
    options: {
      cwd: PROJECT_DIR,
      systemPrompt: { type: 'preset', preset: 'claude_code' },
      settingSources: ['project'],
    },
  })) {
    messages.push(message);
  }
  return messages;
}
```

### 4.2 스킬 파일

프로젝트 루트에 `.claude/commands/generate.md` 스킬을 배치하여 카드뉴스 생성 품질을 높인다:

```markdown
# generate.md (예시)
당신은 카드뉴스 디자이너입니다.

## 규칙
- 각 슬라이드는 독립적인 HTML 파일 (slide-1.html, slide-2.html, ...)
- 크기: 1080x1080px (CSS로 고정)
- 폰트: Pretendard (Google Fonts CDN)
- 배경/텍스트 색상은 대비를 충분히 줄 것
- 텍스트는 간결하게 (슬라이드당 2~3줄)
- output/ 폴더에 저장

## 슬라이드 구성
1. 표지 (제목 + 부제)
2~4. 본문 (핵심 내용)
5. 마무리 (요약 또는 CTA)
```

### 4.3 IPC 통신

```
Renderer (React)                    Main Process
    │                                    │
    │── ipc: generate(topic, style) ────>│
    │                                    │── claude SDK 호출
    │<── ipc: progress(status) ─────────│
    │<── ipc: complete(slides[]) ────────│
    │                                    │
    │── ipc: edit(slideNum, text) ──────>│
    │                                    │── claude SDK 호출
    │<── ipc: slideUpdated(num) ─────────│
    │                                    │
    │── ipc: export(format, size) ──────>│
    │                                    │── html2canvas / puppeteer
    │<── ipc: exported(paths[]) ─────────│
```

---

## 5. UI 화면 구성

### 5.1 메인 화면

```
┌──────────────────────────────────────────────┐
│  Card News Generator                    [─][□][×] │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │  주제 입력                               │ │
│  │  [                                     ] │ │
│  │  스타일: [심플 ▼]   장수: [5 ▼]          │ │
│  │  [ 생성하기 ]                            │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│  │ 1  │ │ 2  │ │ 3  │ │ 4  │ │ 5  │        │
│  │    │ │    │ │    │ │    │ │    │        │
│  │    │ │    │ │    │ │    │ │    │        │
│  └────┘ └────┘ └────┘ └────┘ └────┘        │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │  수정 요청                               │ │
│  │  [3번 슬라이드 배경을 파란색으로 변경    ] │ │
│  │  [ 수정하기 ]              [ 내보내기 ]  │ │
│  └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 5.2 슬라이드 확대 보기 (모달)

```
┌──────────────────────────────────┐
│         슬라이드 3 / 5      [×]  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │    (1080x1080 미리보기)     │  │
│  │                            │  │
│  └────────────────────────────┘  │
│  [◀ 이전]              [다음 ▶]  │
│  ┌────────────────────────────┐  │
│  │ 수정 요청: [             ] │  │
│  │ [ 수정 ]     [ PNG 저장 ]  │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

---

## 6. 프로젝트 구조

```
card-news-app/
├── package.json
├── tsconfig.json
├── electron-builder.yml
├── .claude/
│   └── commands/
│       ├── generate.md          # 카드뉴스 생성 스킬
│       └── edit.md              # 카드뉴스 수정 스킬
├── src/
│   ├── main/                    # Electron Main Process
│   │   ├── index.ts             # 앱 진입점
│   │   ├── ipc.ts               # IPC 핸들러
│   │   └── claude.ts            # Claude Code SDK 래퍼
│   ├── renderer/                # React (Renderer Process)
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── TopicInput.tsx       # 주제 입력 폼
│   │   │   ├── SlideGrid.tsx        # 슬라이드 썸네일 그리드
│   │   │   ├── SlidePreview.tsx     # 슬라이드 확대 미리보기
│   │   │   ├── EditInput.tsx        # 수정 요청 입력
│   │   │   └── ExportButton.tsx     # 내보내기 버튼
│   │   ├── hooks/
│   │   │   ├── useCardNews.ts       # 생성/수정 상태 관리
│   │   │   └── useExport.ts         # 내보내기 로직
│   │   └── styles/
│   │       └── global.css
│   └── shared/
│       └── types.ts             # 공유 타입 정의
├── output/                      # 생성된 카드뉴스 HTML
│   ├── slide-1.html
│   ├── slide-2.html
│   └── exported/                # 내보낸 PNG 이미지
└── README.md
```

---

## 7. 개발 단계

### Phase 1 - MVP (핵심 기능)
1. Electron + React 프로젝트 셋업
2. Claude Code SDK 연동 (Main Process)
3. 카드뉴스 생성 스킬 작성
4. 주제 입력 → 생성 → 미리보기 파이프라인
5. 텍스트 기반 수정 요청
6. PNG 내보내기

### Phase 2 - UX 개선
1. 스타일 프리셋
2. 슬라이드 드래그 앤 드롭 순서 변경
3. 생성 중 스트리밍 진행 표시
4. 프로젝트 저장/불러오기

### Phase 3 - 확장 (선택)
1. 옵시디언 연동 (지식베이스 → 카드뉴스)
2. 인스타그램 자동 업로드
3. 템플릿 마켓플레이스

---

## 8. 비기능 요구사항

| 항목 | 요구사항 |
|------|---------|
| 인증 | 불필요 (Claude Code 구독으로 동작) |
| 성능 | 카드뉴스 5장 생성 30초 이내 |
| 플랫폼 | macOS 우선 (Electron이므로 Windows/Linux 확장 가능) |
| 오프라인 | Claude Code 연결 필요 (오프라인 불가) |
| 저장 | 로컬 파일시스템 (output/ 폴더) |

---

## 9. 전제 조건

- Claude Code가 설치되어 있고 구독 중이어야 함
- `@anthropic-ai/claude-agent-sdk`가 Electron Main Process에서 정상 동작해야 함
- Node.js 18+ 환경
