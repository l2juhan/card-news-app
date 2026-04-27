import { useEffect, useState } from 'react';
import type { UpdateStatusEvent } from '../../shared/types';

type DisplayState =
  | { kind: 'hidden' }
  | { kind: 'downloading'; percent: number }
  | { kind: 'downloaded'; version: string }
  | { kind: 'error'; message: string };

export function UpdateNotification() {
  const [state, setState] = useState<DisplayState>({ kind: 'hidden' });

  useEffect(() => {
    return window.api.onUpdateStatus((event: UpdateStatusEvent) => {
      switch (event.kind) {
        case 'downloading':
          setState({ kind: 'downloading', percent: Math.round(event.progress.percent) });
          break;
        case 'downloaded':
          setState({ kind: 'downloaded', version: event.info.version });
          break;
        case 'error':
          setState({ kind: 'error', message: event.message });
          break;
        case 'checking':
        case 'available':
        case 'not-available':
          // 다운로드/완료 시점에만 사용자에게 노출 — 평소엔 조용히 동작
          break;
      }
    });
  }, []);

  if (state.kind === 'hidden') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-border bg-surface shadow-lg">
      {state.kind === 'downloading' && (
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-medium text-text">
            <span>⬇️</span>
            <span>업데이트 다운로드 중...</span>
            <span className="ml-auto tabular-nums text-primary">{state.percent}%</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-tertiary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(state.percent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {state.kind === 'downloaded' && (
        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="text-lg">✨</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text">
                새 버전 v{state.version}이 준비되었습니다
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">
                지금 재시작하면 새 버전으로 업데이트됩니다.
              </p>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setState({ kind: 'hidden' })}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-secondary"
            >
              나중에
            </button>
            <button
              type="button"
              onClick={() => window.api.installUpdate()}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
            >
              지금 재시작
            </button>
          </div>
        </div>
      )}

      {state.kind === 'error' && (
        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text">업데이트 확인 실패</p>
              <p className="mt-0.5 break-words text-xs text-text-secondary">{state.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setState({ kind: 'hidden' })}
              className="text-text-tertiary hover:text-text-secondary"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
