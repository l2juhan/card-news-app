# QUALITY_SCORE.md

> 역할: 영역별 코드 품질 등급 추적. `/quality` 커맨드가 갱신.
> 등급 기준: A(우수) · B(양호) · C(보통) · D(개선 필요) · F(즉시 조치) · N/A(미평가)
> 변화 표시: ↑(개선) · ↓(악화) · →(유지) · 신규 평가는 표시 없음

마지막 평가: 2026-04-28 (Phase 0 — 하네스 도입 시점 베이스라인)

| 영역 | 등급 | 변화 | 주요 갭 / 근거 |
|------|------|------|----------------|
| 컴포넌트 재사용성 | C | — | Container 10 / Pure Presentation 2. 책임 분리 여지 큼. ChatPanel·SlideGrid 등 150줄 이상 파일이 분리 대상 |
| Presentation/Container 분리 | D | — | 컨벤션은 정의됐으나 현재 코드 적용률 낮음(~17% Pure). 신규 코드부터 강제 |
| 상태관리 (Zustand 일관성) | B | — | 단일 store 잘 유지, 모든 액션이 같은 패턴. persist 미적용은 의도적 |
| IPC 정합성 (4곳 동기화) | B | — | shared/types.ts → main/ipc → preload → renderer 순으로 잘 정의됨. 채널 9개 invoke + 7개 send. 새 채널 추가 시 4곳 동기화 절차가 docs/FRONTEND.md 5절에 명시됨 |
| 타입 안전성 | A | — | `any` 0개. strict 모드. shared/types.ts 활용. unknown 활용 일관 |
| 에러 핸들링 | C | — | IPC 핸들러 try/catch 일관, 그러나 silent failure 1건(useIpc.ts:85 console.error). logger 추상화 미도입 |
| 스타일링 일관성 (Tailwind) | C | — | 토큰 미정리. 하드코딩 색상(`bg-blue-500`, `bg-gray-100` 등) 반복. docs/DESIGN.md 1절 토큰화 진행 필요 |
| 접근성 (a11y) | N/A | — | aria-label, role, focus management 평가 미실시. 향후 키보드 네비게이션 점검 필요 |
| 테스트 커버리지 | F | — | 단위/통합 테스트 0개. `__tests__/structural/`만 골격 존재. 도입 결정 보류 중 |
| 빌드/패키징 안정성 | B | — | electron-builder + electron-updater 설정 완료, mac/win/linux 빌드 스크립트 존재. CI에서 빌드 검증 추가 여지 |
| 보안 (renderer 격리) | A | — | contextIsolation 사용, Node API renderer 노출 0건, hardcoded secret 0건 |
| 의존성 건강 | C | — | `npm audit` 시점 10건(5 moderate + 5 high). transitive 위주이며 직접 영향 영역 점검 필요 |
| 문서 ↔ 코드 정합성 | B | — | CLAUDE.md / docs/FRONTEND·DESIGN 신규 작성 직후. 첫 `/health` 실행 시 본격 평가 |

## 등급 체계 정의

| 등급 | 의미 |
|------|------|
| **A** | 컨벤션 완벽 준수, 추가 개선 여지 없음 또는 미미 |
| **B** | 큰 문제 없음, 1~2개 개선점 존재 |
| **C** | 작동하지만 일관성/품질 갭 명확, 장기적으로 부채화 |
| **D** | 다수의 위반/누락, 단기 우선순위로 정리 필요 |
| **F** | 결함/누락이 사용성/안정성에 직접 영향, 즉시 조치 |
| **N/A** | 평가 불가 또는 평가 미실시 |

## 갱신 이력

| 날짜 | 트리거 | 주요 변동 |
|------|--------|----------|
| 2026-04-28 | 하네스 도입 베이스라인 | 13개 영역 초기 평가. 다음 평가 시점부터 변화(↑↓→) 표기 |
