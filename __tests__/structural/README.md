# 구조적 테스트 (Structural Tests)

> 역할: 코드 패턴/구조를 기계적으로 검증하는 테스트 모음.
> `harness-feedback` Level 3 또는 `/gc` 가비지 컬렉션 과정에서 자동 생성된다.

## 일반 단위 테스트와의 차이

| 비교 | 단위 테스트 | 구조적 테스트 |
|------|------------|---------------|
| 검증 대상 | 함수의 입출력 | 파일/모듈의 패턴 준수 여부 |
| 예시 | `add(1,2) === 3` | "모든 컴포넌트 파일이 PascalCase인가" |
| 도구 | Vitest / Jest | grep / AST 파싱 / 정규식 |
| 실행 시점 | 항상 (CI) | CI + `/gc` |

## 추가 후보 (현재 미구현)

| 검증 항목 | 패턴 |
|----------|------|
| Renderer 코드에서 Node API 직접 사용 금지 | `src/renderer/**/*.{ts,tsx}` 에 `from 'fs'\|'path'\|'electron'` 임포트가 있는지 |
| Main 코드에서 React/JSX 금지 | `src/main/**/*.ts` 에 JSX 또는 `.tsx` 확장자 금지 |
| 컴포넌트 파일 네이밍 | `src/renderer/components/` 의 파일명이 PascalCase인가 |
| 훅 파일 네이밍 | `src/renderer/hooks/` 의 파일명이 `use*.ts` 패턴인가 |
| IPC 4곳 동기화 | `src/shared/types.ts`의 모든 IPC 페이로드 타입이 main/preload/renderer에서 import 되는가 |
| 하드코딩 절대 경로 | 모든 `.ts/.tsx` 파일에서 `/Users/`, `C:\\` 패턴이 있는지 |

## 작성 규칙

- 한 테스트 파일은 한 패턴만 검증
- 파일명: `{number}-{check-name}.test.ts` (예: `01-no-node-in-renderer.test.ts`)
- 실패 시 어떤 파일/줄이 위반했는지 명확히 출력
- 신규 추가는 `harness-feedback` Level 3 또는 사용자 명시 요청 시에만 (자동 추가 금지)

## 실행

테스트 러너 도입 후 `npm run test:structural` 추가 예정. 현재는 ad-hoc grep 또는 `/gc` 실행으로 검증.
