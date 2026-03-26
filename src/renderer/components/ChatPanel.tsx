import { useEffect, useRef } from 'react';
import { useCardNewsStore } from '../stores/useCardNewsStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { LoadingIndicator } from './LoadingIndicator';

export function ChatPanel() {
  const messages = useCardNewsStore((s) => s.messages);
  const isGenerating = useCardNewsStore((s) => s.isGenerating);
  const isEditing = useCardNewsStore((s) => s.isEditing);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isBusy = isGenerating || isEditing;

  // ---- 새 메시지가 추가되거나 로딩 상태 변경 시 자동 스크롤 ----
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBusy]);

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <header className="flex-shrink-0 h-12 border-b border-border flex items-center px-5 drag-region">
        <h1 className="text-sm font-semibold text-text no-drag">
          카드뉴스 만들기
        </h1>
      </header>

      {/* 메시지 목록 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-2">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* 로딩 인디케이터 */}
        {isBusy && <LoadingIndicator />}

        {/* 스크롤 앵커 */}
        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 */}
      <ChatInput />
    </div>
  );
}
