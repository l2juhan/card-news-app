#!/usr/bin/env bash
# PostToolUse Hook — 자동 교정 루프
#
# Claude Code가 Edit/Write/MultiEdit를 호출할 때마다 stdin으로 JSON event를 받는다.
# 대상이 .ts/.tsx 파일이면:
#   1) eslint --fix 로 자동 교정
#   2) tsc --noEmit 로 타입 체크
# 출력은 Claude의 컨텍스트로 주입되므로, 에이전트가 보고 스스로 수정한다.
#
# 종료 코드:
#   0  : 통과 또는 비대상 파일
#   1  : eslint/tsc 에러 (Claude가 출력 보고 수정 시도)

set -uo pipefail

# stdin에서 JSON event 파싱
EVENT=$(cat)
FILE=$(printf '%s' "$EVENT" | jq -r '.tool_input.file_path // empty')

# 파일 경로 없으면 종료
[ -z "$FILE" ] && exit 0

# .ts / .tsx 가 아니면 종료
case "$FILE" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

# 외부 레포(symlink) 또는 빌드 결과물은 건너뜀
case "$FILE" in
  */templates/*|*/scripts/*|*/dist/*|*/release/*|*/build/*|*/node_modules/*) exit 0 ;;
esac

cd "$CLAUDE_PROJECT_DIR" || exit 0

EXIT=0

# 1) ESLint --fix (자동 교정 + 미해결 에러 출력)
echo "── ESLint ──"
if ! npx --no-install eslint --fix "$FILE"; then
  EXIT=1
fi

# 2) TypeScript typecheck (전체 — 작은 프로젝트라 빠름)
#    main / renderer 분리된 tsconfig 둘 다 검사. 다른 파일 에러도 표시되지만
#    수정한 파일이 의존 그래프에 영향 줄 수 있으므로 의도된 동작.
echo "── TypeScript ──"
case "$FILE" in
  */src/main/*|*/src/preload/*|*/src/shared/*)
    if ! npx --no-install tsc -p tsconfig.main.json --noEmit; then
      EXIT=1
    fi
    ;;
esac
case "$FILE" in
  */src/renderer/*|*/src/shared/*)
    if ! npx --no-install tsc -p tsconfig.renderer.json --noEmit; then
      EXIT=1
    fi
    ;;
esac

exit $EXIT
