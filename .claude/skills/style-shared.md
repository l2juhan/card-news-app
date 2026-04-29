---
description: "모든 카드뉴스 스타일이 공유하는 공통 슬라이드 타입 정의. 각 style-*.md 가이드는 이 문서를 단일 출처(SoT)로 참조한다. 직접 트리거되지 않으며 다른 스타일 스킬에서 링크로 안내된다."
---

# 카드뉴스 스타일 공통 정의

> 이 파일은 모든 `/style-{name}` 스킬이 참조하는 단일 출처(Single Source of Truth)다.
> 슬라이드 타입 목록을 변경하려면 **이 파일만 수정**하고, 각 style 문서는 링크만 유지한다.

## 공통 슬라이드 타입 (14종)

`cover`, `content`, `content-stat`, `content-quote`, `cta`, `content-image`,
`content-steps`, `content-list`, `content-badge`, `content-split`,
`content-highlight`, `content-grid`, `content-bigdata`, `content-fullimage`

각 타입의 필드/사용 시점은 `.claude/skills/card-news.md`의 “공통 슬라이드 타입 레퍼런스” 표를 참조.

## 사용 규약

- 새 스타일 스킬을 만들 때 위 14종을 그대로 지원해야 한다(누락 시 `/card-news` 파이프라인이 해당 슬라이드를 렌더링할 수 없음).
- 스타일 전용 추가 타입(예: `content-code`)은 본 공통 목록에 포함하지 말고 각 `/style-{name}` 문서의 “전용 슬라이드 타입” 섹션에 별도 기재한다.
- 공통 목록을 줄이거나 늘리려면 본 파일과 `card-news.md`의 레퍼런스 표를 함께 갱신하고, 모든 `/style-*.md`가 자동으로 본 파일을 링크하므로 개별 수정은 불필요하다.

## 참조 문서

- 슬라이드 타입 필드 정의: `.claude/skills/card-news.md`
- 새 템플릿 작성 절차: `.claude/skills/create-template.md`
