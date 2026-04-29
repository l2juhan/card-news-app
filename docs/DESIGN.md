# DESIGN.md

> 역할: card-news-app **앱 UI**(Electron 윈도우 안의 React UI)의 디자인 시스템.
> ⚠️ 카드뉴스 콘텐츠 자체의 스타일(`templates/style-*`)은 **이 문서 범위가 아니며**, instagram-card-news 원본 레포에서 관리한다.

## 1. 디자인 토큰 — 현재 코드에서 추출

### 색상

| 토큰 | 값 | 사용처 |
|---|---|---|
| `accentColor` (default) | `#6C5CE7` | 사용자 강조색, store 초기값. `ColorPicker`에서 변경 가능. 동적 색이라 인라인 style 허용 |
| 채팅 user bubble | `bg-blue-500` (Tailwind) | `ChatMessage` 사용자 메시지 |
| 채팅 assistant bubble | `bg-gray-100` | `ChatMessage` AI 메시지 |
| 에러 메시지 | `bg-red-50 text-red-700` | `ChatMessage` 에러 |
| 사이드바 배경 | `bg-gray-900 text-white` | `SideNav` |
| 메인 배경 | `bg-white` | App 바깥 영역 |
| Phone Mockup 프레임 | `bg-black` | `PhoneMockup` 폰 프레임 |

> 신규 색을 도입할 때는 위 표에 먼저 등록한 뒤 사용한다. **하드코딩된 hex 색상이 두 번 이상 반복되면 토큰화 대상.**

### 타이포그래피

| 용도 | Tailwind 클래스 |
|---|---|
| 사이드바 라벨 | `text-sm font-medium` |
| 채팅 본문 | `text-sm` |
| 슬라이드 번호 표시 | `text-xs text-gray-500` |
| 버튼 라벨 | `text-sm font-medium` |
| 헤더(있다면) | `text-base font-semibold` |

> Tailwind 4 기본 폰트 스택 사용. 별도 웹폰트 미사용. (카드뉴스 PNG 내부 폰트는 templates에서 관리하는 별개 영역)

### 스페이싱

| 사용처 | 클래스 |
|---|---|
| 컴포넌트 내부 패딩 | `p-3` ~ `p-4` |
| 컴포넌트 간 간격 | `gap-2` ~ `gap-4` |
| 버튼 패딩 | `px-3 py-1.5` (small) / `px-4 py-2` (medium) |
| 사이드바 너비 | `w-60` |
| Phone Mockup 너비 | `w-[280px]` (또는 `w-[320px]`) |

### 라운딩 / 그림자

| 용도 | 클래스 |
|---|---|
| 카드/패널 | `rounded-lg` |
| 채팅 버블 | `rounded-2xl` |
| 버튼 | `rounded-md` |
| Phone Mockup 프레임 | `rounded-[40px]` |
| 그림자 | `shadow-sm` (가벼운 카드) / `shadow-md` (떠 있는 패널) |

## 2. 레이아웃 컴포지션

```text
┌─────────┬──────────────────┬─────────────────┐
│ SideNav │ ChatPanel        │ PreviewPanel    │
│ w-60    │ flex-1           │ w-[400px]+      │
│         │                  │ (PhoneMockup)   │
└─────────┴──────────────────┴─────────────────┘
```

- 3-column 가로 분할 고정
- 좌측: 네비 (만들기/작업목록/설정)
- 중앙: 채팅 (생성/편집 입력 + 메시지 히스토리)
- 우측: 미리보기 (PhoneMockup + SlideNavigator + SlideEditor)

## 3. 컴포넌트 스타일 규칙

### 버튼
- primary: `bg-blue-500 text-white hover:bg-blue-600`
- secondary: `bg-gray-100 text-gray-700 hover:bg-gray-200`
- destructive: `bg-red-500 text-white hover:bg-red-600`
- disabled: `opacity-50 cursor-not-allowed`

### 입력 필드
- `border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500`

### 모달/팝오버 (현재 거의 없음, 도입 시)
- 배경: `bg-white shadow-lg rounded-lg`
- 오버레이: `bg-black/40` (Tailwind 4 opacity 슬래시 표기)

## 4. 다크 모드
- **현재 미지원**. 도입 시 Tailwind `dark:` prefix + system preference 감지 (Electron `nativeTheme`)
- 도입 결정 전까지 `dark:` 클래스 작성 금지

## 5. 애니메이션
- 슬라이드 이미지 전환: 없음 (단순 src 교체)
- 채팅 메시지 등장: 없음 (즉시 렌더)
- LoadingIndicator: Tailwind `animate-pulse` 또는 `animate-spin` 활용
- 전환 시간 도입 시 일관된 값: `transition-all duration-150`

## 6. Phone Mockup 비율
- 카드뉴스는 두 가지 해상도: `1080×1080`(정사각) / `1080×1350`(4:5)
- PhoneMockup은 4:5 기준으로 표시(Instagram 기본). 정사각 카드뉴스도 같은 프레임에 letterbox로 표시

## 7. 카드뉴스 콘텐츠 스타일 — **범위 밖**
- `templates/style-{aws,blueprint,bold,clean,cs,elegant,linux,magazine,minimal,premium,rn,toss}/` 는 본 레포 소유가 아님
- 디자인 변경이 필요하면 `../instagram-card-news` 레포에서 작업 → 자동으로 본 레포에 반영(symlink)
- 본 레포에서는 **선택 UI(ColorPicker, 스타일 미리보기)** 까지만 책임

## 8. 토큰 갱신 절차
1. 새 색/스페이싱이 두 번 이상 반복되면 위 표에 등록
2. `/gc` 실행 시 하드코딩 검색 → 토큰 치환 제안 자동 생성
3. PR에서 토큰 사용 여부를 QA 에이전트가 검증
