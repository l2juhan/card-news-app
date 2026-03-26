import type { ChatMessage as ChatMessageType } from '../stores/useCardNewsStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);

  if (diff < 10) return '방금';
  if (diff < 60) return `${diff}초 전`;

  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ChatMessageProps {
  message: ChatMessageType;
  onRetry?: () => void;
}

export function ChatMessage({ message, onRetry }: ChatMessageProps) {
  const { role, content, timestamp } = message;

  // ---- system 메시지 ----
  if (role === 'system') {
    return (
      <div className="flex justify-center px-5 py-1.5">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-xs text-text-secondary bg-surface-tertiary rounded-full px-3 py-1 text-center max-w-md">
            {content}
          </span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-[11px] text-primary hover:text-primary-dark border border-primary/30 hover:border-primary
                         rounded-full px-3 py-0.5 transition-colors cursor-pointer"
            >
              다시 시도
            </button>
          )}
        </div>
      </div>
    );
  }

  const isUser = role === 'user';

  return (
    <div
      className={`flex gap-3 px-5 py-1.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* 아바타 */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm text-primary font-semibold">AI</span>
        </div>
      )}

      {/* 본문 */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div
          className={`
            rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words
            ${
              isUser
                ? 'bg-primary text-white rounded-tr-sm'
                : 'bg-surface-secondary text-text rounded-tl-sm'
            }
          `}
        >
          {content}
        </div>

        {/* 타임스탬프 */}
        <span className="mt-1 text-[10px] text-text-tertiary px-1">
          {formatRelativeTime(timestamp)}
        </span>
      </div>
    </div>
  );
}
