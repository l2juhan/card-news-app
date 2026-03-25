---
name: review
description: 현재 Phase 브랜치의 변경사항에 대해 최종 코드리뷰를 수행한다
---

현재 Phase 브랜치의 변경사항에 대해 최종 코드리뷰를 수행한다.

## 1. 리뷰 대상 파악

1. `git branch --show-current`로 현재 브랜치 확인
2. `git log main..HEAD --oneline`으로 Phase 커밋 목록 확인
3. `git diff main...HEAD --stat`으로 변경된 파일 목록 확인
4. `git diff main...HEAD`로 전체 diff 확인

## 2. 코드 분석 (`/sc:analyze`)

`/sc:analyze`를 활용하여 다음 도메인에 대해 분석을 수행한다:

### 2-1. 코드 품질
- TypeScript strict 모드 준수 여부
- 미사용 변수/import 존재 여부
- 타입 안전성 (any 사용, 타입 단언 남용 등)
- 코드 중복 및 복잡도
- CLAUDE.md 코딩 규칙 준수 여부

### 2-2. 보안
- Main Process에서만 Node.js API 사용하는지 확인
- contextBridge를 통한 안전한 IPC 통신 여부
- nodeIntegration: false, contextIsolation: true 확인
- 하드코딩된 경로, 민감 정보 노출 여부
- XSS, 인젝션 등 OWASP 취약점

### 2-3. 성능
- 불필요한 리렌더링 가능성
- 메모리 누수 위험 (이벤트 리스너 해제, Puppeteer 정리 등)
- 번들 크기에 영향을 주는 import

### 2-4. 아키텍처
- Main/Renderer/Preload 역할 분리 준수
- IPC 프로토콜 일관성 (CLAUDE.md 정의와 실제 구현 비교)
- 공유 타입(shared/types.ts) 활용도
- 모듈 간 의존성 방향 (단방향 유지)

## 3. 리뷰 결과 보고

분석 결과를 아래 형식으로 사용자에게 보고한다:

```
## 코드리뷰 결과: Phase {N}

### 요약
- 변경 파일: {N}개
- 변경 라인: +{추가} -{삭제}

### 🔴 Critical (반드시 수정)
- [파일:라인] 설명

### 🟡 Warning (수정 권장)
- [파일:라인] 설명

### 🔵 Info (참고사항)
- [파일:라인] 설명

### ✅ Good Practices
- 잘 작성된 부분에 대한 긍정적 피드백
```

## 4. 수정 처리

- **Critical** 이슈가 있으면 자동으로 수정하고 `/commit`으로 커밋한다
- **Warning** 이슈는 사용자에게 수정 여부를 확인한다
- **Info**는 보고만 하고 넘어간다
- 수정 후 `/test`로 재검증하여 수정이 기존 기능을 깨뜨리지 않았는지 확인한다

## 5. 추가 인자

- `$ARGUMENTS`가 있으면 해당 파일/디렉토리만 집중 리뷰한다
- 인자가 없으면 Phase 전체 변경사항을 리뷰한다
