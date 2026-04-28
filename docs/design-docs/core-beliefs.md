# Core Beliefs — card-news-app

> 역할: 이 프로젝트가 따르는 설계 원칙. 현재 코드 분석 결과로부터 추출.
> 새 기능 설계 시 충돌이 발생하면 이 문서를 우선 참조한다.

## 1. 콘텐츠 도메인은 외부 레포에서 산다
- 카드뉴스 **콘텐츠 자체**(템플릿 HTML, 렌더링 스크립트, 스타일 정의, 콘텐츠 도메인 스킬)는 `../instagram-card-news/`에서 관리
- card-news-app은 **그 콘텐츠를 사용하는 GUI 앱**
- 따라서 `templates/`, `scripts/`, `config.json`은 symlink로 참조하며 본 레포에서 직접 수정하지 않는다
- 콘텐츠 디자인 변경은 instagram-card-news 레포에서, 앱 UX/IPC/패키징 변경은 본 레포에서

## 2. Renderer ↔ Main 경계는 IPC가 유일한 다리
- Renderer는 절대 Node API를 직접 사용하지 않는다 (`fs`, `path`, `child_process` 금지)
- Main은 절대 React/JSX를 작성하지 않는다
- 두 세계 사이의 모든 데이터는 `src/shared/types.ts`에 타입이 정의된 IPC 페이로드로만 전달
- contextBridge로 노출된 `window.api`만이 renderer가 가진 외부 통신 수단이다 (이는 보안 + 유지보수성 둘 다 확보)

## 3. 단일 store로 충분하다 (지금까지는)
- Zustand `useCardNewsStore` 하나가 앱 전역 상태 전부 보유
- 도메인이 늘어도 store를 분할하지 않고 같은 store에 필드와 액션을 더한다
- 이유: 1인 개발 + 앱 규모가 store 분할의 오버헤드를 정당화할 만큼 크지 않음
- 단, 한 store가 200줄을 넘기 시작하면 이 결정 재검토

## 4. 컴포넌트는 분리할 수 있을 때 분리한다
- Presentation/Container 분리 패턴을 신규 코드부터 강제
- 이유: 한 컴포넌트가 상태/로직/표현을 모두 가지면 (a) 테스트 어렵고 (b) 재사용 막히고 (c) 파일이 길어져 AI 에이전트의 컨텍스트 효율이 떨어진다
- 현재 코드는 Container가 다수(10/12) — 신규 작업 시 점진적으로 P/C로 쪼개기

## 5. 타입은 한 곳에서 정의된다
- IPC 페이로드 타입, 슬라이드 타입, 스타일 설정은 `src/shared/types.ts` 한 곳에서 정의
- main, preload, renderer 셋이 같은 타입을 import해서 사용
- 이유: shape mismatch는 IPC 경계에서 가장 자주 발생하며, 타입 단일 소스가 그것을 컴파일 타임에 잡는다
- `any` 0개 유지

## 6. 에러는 사용자에게 보여야 한다
- silent failure(catch 후 아무 처리 없음)는 결함으로 간주
- IPC 핸들러는 실패 시 `card-news:error` 채널로 broadcast → 채팅 메시지로 표시
- console.log/error 같은 개발자 전용 출력은 사용자가 볼 수 없으므로 logger 추상화 도입 후에만 허용 (현재 미도입 → 추가 금지)

## 7. AI 에이전트가 작업할 수 있는 코드를 쓴다
- 짧은 파일, 명확한 책임, 일관된 패턴이 AI 에이전트의 컨텍스트 효율과 작업 품질에 직결
- 컨벤션은 `docs/FRONTEND.md`, 디자인 토큰은 `docs/DESIGN.md`에 단일 소스로
- 위반은 PostToolUse Hook(즉시) + QA 에이전트(작업 단위) + `/health`(주기적)의 3단계로 잡는다
- 같은 위반이 반복되면 `harness-feedback`이 ESLint 규칙으로 승격 또는 교정 지시 업데이트

## 8. 외부 의존은 최소화한다
- 핵심 의존성 6개로 충분: electron, react, zustand, tailwindcss, puppeteer, @anthropic-ai/claude-agent-sdk
- 새 의존성 추가는 PR에서 명시적 정당화 필요 (대안 검토 + 번들 크기 영향)
- 데스크톱 앱이라 브라우저보다 번들 크기 민감도는 낮지만, 보안 표면이 늘어남

## 9. 사용자 행동은 즉각 피드백을 받는다
- 생성/편집/내보내기 등 주요 동작은 진행률(`card-news:progress`)을 broadcast
- 생성 중에는 추가 입력 차단(`isGenerating` 플래그)
- 결과는 채팅 메시지로 명시적 알림 (성공/실패 둘 다)

## 10. 패키징된 앱은 독립적이어야 한다
- electron-builder는 symlink를 따라가 실제 파일을 복사 → 배포 앱은 instagram-card-news 없이 동작
- 자동 업데이트(electron-updater)는 GitHub Releases 기반
- 코드 서명/notarization은 macOS 배포의 필수 조건

---

> 이 원칙들이 근거 없이 위배되면 PR 단계에서 QA 에이전트가 critical로 분류한다.
> 원칙 자체를 바꿔야 하는 상황이 오면, 먼저 이 문서를 갱신하고 그 PR에서 충돌 규칙을 동시에 정리한다.
