# Generated Docs

> ⚠️ **이 폴더의 파일은 자동 생성된다. 직접 수정 금지.**
>
> 갱신은 다음 경로로:
> - `/gc` 또는 `/health` 커맨드가 코드를 스캔하여 갱신
> - `harness-feedback` 또는 QA 에이전트가 변경 감지 시 갱신 제안

## 파일

| 파일 | 출처 | 갱신 트리거 |
|------|------|------------|
| `api-schema.md` | `src/shared/types.ts` + `src/main/ipc.ts` + `src/preload/index.ts` | IPC 채널 추가/변경 시 |
| `component-inventory.md` | `src/renderer/components/**/*.tsx` 스캔 | 컴포넌트 추가/삭제/이동 시 |

## 직접 수정이 필요한 경우
1. 원본 코드를 먼저 수정
2. `/gc` 또는 `/health`를 실행해 자동 갱신
3. PR에 두 변경(코드 + generated/)을 함께 포함
