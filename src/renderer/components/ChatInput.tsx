import {
  useRef,
  useState,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import { useCardNewsStore } from '../stores/useCardNewsStore';
import { useChat } from '../hooks/useChat';
import type { StyleName } from '../../shared/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ROWS = 4;
const LINE_HEIGHT = 24; // px – matches leading-normal at text-sm/base

const SLIDE_COUNT_OPTIONS = [5, 7, 9, 11, 13];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');

  const slides = useCardNewsStore((s) => s.slides);
  const style = useCardNewsStore((s) => s.style);
  const slideCount = useCardNewsStore((s) => s.slideCount);
  const styles = useCardNewsStore((s) => s.styles);
  const isGenerating = useCardNewsStore((s) => s.isGenerating);
  const isEditing = useCardNewsStore((s) => s.isEditing);
  const setStyle = useCardNewsStore((s) => s.setStyle);
  const setSlideCount = useCardNewsStore((s) => s.setSlideCount);

  const { sendMessage } = useChat();

  const isBusy = isGenerating || isEditing;
  const isFirstGeneration = slides.length === 0;

  // ---- 자동 높이 조절 ----
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = LINE_HEIGHT * MAX_ROWS;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, []);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      adjustHeight();
    },
    [adjustHeight],
  );

  // ---- 전송 ----
  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;

    setText('');
    // 높이 리셋
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage(trimmed);
  }, [text, isBusy, sendMessage]);

  // ---- Enter / Shift+Enter ----
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  // ---- 스타일 목록 ----
  const styleEntries = Object.entries(styles) as [StyleName, { description: string }][];

  return (
    <div className="border-t border-border bg-surface px-5 py-3">
      {/* 첫 생성 시 옵션 행 */}
      {isFirstGeneration && (
        <div className="flex items-center gap-3 mb-3">
          {/* 스타일 드롭다운 */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="style-select"
              className="text-xs text-text-secondary whitespace-nowrap"
            >
              스타일
            </label>
            <select
              id="style-select"
              value={style}
              onChange={(e) => setStyle(e.target.value as StyleName)}
              disabled={isBusy}
              className="text-xs bg-surface-secondary border border-border rounded-lg px-2 py-1.5
                         text-text focus:outline-none focus:ring-1 focus:ring-primary/40
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {styleEntries.length > 0
                ? styleEntries.map(([name, cfg]) => (
                    <option key={name} value={name}>
                      {name} – {cfg.description}
                    </option>
                  ))
                : /* 스타일 미로드 시 기본 옵션 */
                  <option value={style}>{style}</option>
              }
            </select>
          </div>

          {/* 장수 선택 */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="count-select"
              className="text-xs text-text-secondary whitespace-nowrap"
            >
              장수
            </label>
            <select
              id="count-select"
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              disabled={isBusy}
              className="text-xs bg-surface-secondary border border-border rounded-lg px-2 py-1.5
                         text-text focus:outline-none focus:ring-1 focus:ring-primary/40
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {SLIDE_COUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}장
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 입력 행 */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isBusy}
          rows={1}
          placeholder={
            isFirstGeneration
              ? '카드뉴스 주제를 입력하세요...'
              : '수정 사항을 입력하세요...'
          }
          className="flex-1 resize-none rounded-xl border border-border bg-surface-secondary
                     px-4 py-2.5 text-sm leading-normal text-text
                     placeholder:text-text-tertiary
                     focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary-light
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* 전송 버튼 */}
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={isBusy || text.trim().length === 0}
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary text-white
                     flex items-center justify-center transition-colors
                     hover:bg-primary-dark active:bg-primary-dark
                     disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="전송"
        >
          {/* 화살표 아이콘 (SVG) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M3.105 3.29a.75.75 0 0 1 .814-.12l13.5 6.5a.75.75 0 0 1 0 1.36l-13.5 6.5A.75.75 0 0 1 2.88 16.6L5.378 10 2.88 3.4a.75.75 0 0 1 .225-.11ZM6.56 10.75l-1.87 4.94L14.68 10 4.69 4.31l1.87 4.94h4.19a.75.75 0 0 1 0 1.5H6.56Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
