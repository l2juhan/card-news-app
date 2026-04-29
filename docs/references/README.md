# References

> 역할: 외부 라이브러리/프레임워크 레퍼런스 보관소.
> 파일명 규칙: `{라이브러리명}-llms.txt` (LLM 친화 포맷) 또는 `{라이브러리명}.md`

## 권장 보관 항목

| 라이브러리 | 권장 파일 | 용도 |
|---|---|---|
| Electron | `electron-llms.txt` | IPC, BrowserWindow, app lifecycle 참고 |
| @anthropic-ai/claude-agent-sdk | `claude-agent-sdk-llms.txt` | 스트리밍, tool use, prompt caching |
| Puppeteer | `puppeteer-llms.txt` | screenshot, page lifecycle |
| Tailwind 4 | `tailwind-v4-llms.txt` | 새 v4 directive 변경점 |
| Zustand 5 | `zustand-v5-llms.txt` | new createSelectors, immer middleware |
| electron-builder | `electron-builder-llms.txt` | mac/win/linux 빌드 옵션 |
| electron-updater | `electron-updater-llms.txt` | 자동 업데이트 lifecycle |

## 사용 안내

- 작업 중 라이브러리 API가 불확실하면 이 폴더에 해당 파일이 있는지 먼저 확인
- 없으면 `context7` MCP로 즉석 조회 가능 (전역적으로 사용 가능)
- 대용량 레퍼런스를 한 번 받아두면 token 사용량 절감

## 폴더 정책

- `README.md`, `.gitkeep`는 커밋 유지(폴더 자체와 사용 안내는 추적 대상).
- 대용량 원문 레퍼런스 파일(`*-llms.txt` 등)은 기본적으로 커밋하지 않음(저장소 비대화 방지).
- 필요 시 `.gitignore`에 별도 패턴 추가 검토.
