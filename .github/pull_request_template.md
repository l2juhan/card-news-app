<!-- PR 제목은 Conventional Commits 스타일 필수: feat: / fix: / refactor: / docs: / chore: -->
<!-- 예: feat(renderer): 슬라이드 자동 저장 추가 / fix(main): IPC 핸들러 누락 등록 -->
<!-- 형식 위반은 리뷰어가 반려한다. -->

## 관련 이슈
Closes #

## 요약
<!-- 무엇을 왜 바꿨는가. 1~3문장 -->

## 변경 사항
- [ ] Renderer:
- [ ] Main / Preload:
- [ ] 템플릿 / 렌더링:
- [ ] docs/:
- [ ] 빌드 / 패키징:

## 검증
- [ ] `npm run typecheck` 통과
- [ ] `npm run lint` 통과
- [ ] PostToolUse Hook 자동 교정 통과
- [ ] 수동 시나리오 검증:
  -
- [ ] 카드뉴스 생성/수정/내보내기 골든 패스 회귀 없음

## 스크린샷 / 데모
<!-- UI 변경이 있을 경우 -->

## 체크리스트
- [ ] docs/FRONTEND.md / docs/DESIGN.md 규칙 준수
- [ ] 새 패턴 도입 시 docs/ 갱신
- [ ] IPC 시그니처 변경 시 src/shared/types.ts 동기화
- [ ] symlink 경로(templates/, scripts/) 무결성 확인 (`.claude/skills/`는 본 레포 소유 — symlink 아님)
- [ ] 백엔드 책임 영역 침범 없음 (이 프로젝트는 FE+디자인 범위)

## 비고
<!-- 리뷰어가 알아야 할 트레이드오프, 후속 작업 등 -->
