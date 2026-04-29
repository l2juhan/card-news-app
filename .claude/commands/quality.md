---
name: quality
description: card-news-app 품질 등급 재평가 — docs/QUALITY_SCORE.md의 13개 영역 등급(A~F) 갱신
---

# /quality — 품질 등급 재평가

> `docs/QUALITY_SCORE.md`를 코드 분석 결과에 기반해 갱신.
> 매 PR 머지 후 또는 월 1회 실행 권장.

## 평가 영역 (13개)

| 영역 | 평가 방법 |
|------|----------|
| 컴포넌트 재사용성 | 컴포넌트 수 / Pure Presentation 비율 / 중복 JSX 패턴 |
| Presentation/Container 분리 | Pure 비율 추이 / 150줄 초과 파일 수 |
| 상태관리 (Zustand 일관성) | 액션 패턴 일관성 / dead 필드 / resetProject 누락 |
| IPC 정합성 | shared/types ↔ ipc.ts ↔ preload ↔ renderer 4곳 mismatch 검색 |
| 타입 안전성 | `any` / `as unknown as` / 타입 단언 빈도 |
| 에러 핸들링 | try/catch 비율 / silent failure / `console.*` 잔존 / `card-news:error` broadcast 사용 |
| 스타일링 일관성 (Tailwind) | 하드코딩 hex 빈도 / 인라인 style 빈도 / docs/DESIGN.md 토큰 활용도 |
| 접근성 (a11y) | aria-label / role / 키보드 navigation / focus management 검증 |
| 테스트 커버리지 | 단위/통합/구조 테스트 존재 + 커버리지 % |
| 빌드/패키징 안정성 | electron-builder 설정 완성도 / CI 빌드 검증 / 코드 서명 |
| 보안 (renderer 격리) | contextIsolation / nodeIntegration / preload 노출 표면 |
| 의존성 건강 | `npm audit` 결과 / outdated 비율 |
| 문서 ↔ 코드 정합성 | `/health` 결과 종합 |

## 등급 체계

| 등급 | 기준 |
|------|------|
| A | 컨벤션 완벽 준수, 추가 개선 여지 미미 |
| B | 큰 문제 없음, 1~2개 개선점 |
| C | 작동하나 일관성/품질 갭 명확, 부채화 위험 |
| D | 다수 위반/누락, 단기 정리 필요 |
| F | 결함이 사용성/안정성에 직접 영향, 즉시 조치 |
| N/A | 평가 불가 (도구/데이터 부족) |

## 실행 단계

### 1. 자동 측정 (스크립트/grep)
- `npm run lint` 결과 (error/warning 수)
- `npm run typecheck` 통과 여부
- 컴포넌트 줄 수 분포
- 하드코딩 hex 빈도
- IPC 채널 수 + 4곳 일치 여부
- `npm audit` 결과
- 테스트 파일 수

### 2. 정성 판단 (코드 샘플링)
- 컴포넌트 분리 적절성
- 에러 메시지 사용자 친화성
- a11y 마크업 존재 여부
- 모듈 응집도/결합도

### 3. 등급 산정
각 영역별로:
- 측정값 + 정성 판단 → 등급
- 이전 등급과 비교 → 변화 표시 (↑↓→)
- 근거 한 줄 (반드시)

### 4. `docs/QUALITY_SCORE.md` 갱신
- 표 갱신
- "마지막 평가" 날짜 업데이트
- "갱신 이력" 표 상단에 새 행 추가:

  ```markdown
  | 2026-04-28 | /quality 자동 실행 | 컴포넌트 재사용성 C→B (P/C 분리 진척) ... |
  ```

### 5. 보고

```markdown
## /quality 결과 — {YYYY-MM-DD}

### 변화
- 컴포넌트 재사용성: C → B ↑ (Pure 비율 14% → 25%)
- 에러 핸들링: C → B ↑ (console.* 0건)

### 유지
- 타입 안전성: A → (any 0개 유지)

### 악화 ⚠️
- (없음)

### 권장 액션
- 테스트 커버리지 F → 도입 결정 필요
- 접근성 N/A → 키보드 네비 검증 후 평가
```

## 인자

- `$ARGUMENTS` 있으면 해당 영역만 재평가 (예: `/quality 타입 안전성`)
- 없으면 전체 13개 영역
