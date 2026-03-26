import { useCardNewsStore } from '../stores/useCardNewsStore';

export function LoadingIndicator() {
  const progress = useCardNewsStore((s) => s.progress);

  return (
    <div className="flex items-start gap-3 px-5 py-3">
      {/* 아바타 */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-sm text-primary font-semibold">AI</span>
      </div>

      {/* 말풍선 */}
      <div className="bg-surface-secondary rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs">
        {/* 점 3개 타이핑 애니메이션 */}
        <div className="flex items-center gap-1.5">
          <span className="typing-dot w-2 h-2 rounded-full bg-text-tertiary" />
          <span className="typing-dot w-2 h-2 rounded-full bg-text-tertiary animation-delay-150" />
          <span className="typing-dot w-2 h-2 rounded-full bg-text-tertiary animation-delay-300" />
        </div>

        {/* 진행 상태 텍스트 */}
        {progress && (
          <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
            <span>{progress.status}</span>
            {progress.percent > 0 && (
              <span className="tabular-nums font-medium text-primary">
                {progress.percent}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* CSS 키프레임 (Tailwind v4에서 인라인 스타일로 처리) */}
      <style>{`
        .typing-dot {
          animation: typing-bounce 1.4s infinite ease-in-out both;
        }
        .animation-delay-150 {
          animation-delay: 0.15s;
        }
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        @keyframes typing-bounce {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.4;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
