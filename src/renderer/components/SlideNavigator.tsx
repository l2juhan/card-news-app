import { useEffect, useCallback } from 'react';
import { useCardNewsStore } from '../stores/useCardNewsStore';

export function SlideNavigator() {
  const slides = useCardNewsStore((s) => s.slides);
  const selectedSlide = useCardNewsStore((s) => s.selectedSlide);
  const selectSlide = useCardNewsStore((s) => s.selectSlide);

  const total = slides.length;

  const goFirst = useCallback(() => {
    if (total > 0) selectSlide(1);
  }, [total, selectSlide]);

  const goPrev = useCallback(() => {
    if (selectedSlide > 1) selectSlide(selectedSlide - 1);
  }, [selectedSlide, selectSlide]);

  const goNext = useCallback(() => {
    if (selectedSlide < total) selectSlide(selectedSlide + 1);
  }, [selectedSlide, total, selectSlide]);

  const goLast = useCallback(() => {
    if (total > 0) selectSlide(total);
  }, [total, selectSlide]);

  // 키보드 화살표 키 지원
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서는 무시
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goPrev, goNext]);

  // 슬라이드가 없으면 렌더링하지 않음
  if (total === 0) return null;

  const isFirst = selectedSlide <= 1;
  const isLast = selectedSlide >= total;

  const btnBase =
    'flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium transition-colors cursor-pointer select-none';
  const btnEnabled =
    'text-text-secondary hover:bg-surface-tertiary hover:text-text active:bg-border-light';
  const btnDisabled = 'text-text-tertiary/40 cursor-not-allowed';

  return (
    <div className="flex items-center justify-center gap-1 py-3">
      {/* 처음 */}
      <button
        onClick={goFirst}
        disabled={isFirst}
        className={`${btnBase} ${isFirst ? btnDisabled : btnEnabled}`}
        aria-label="첫 슬라이드"
      >
        «
      </button>

      {/* 이전 */}
      <button
        onClick={goPrev}
        disabled={isFirst}
        className={`${btnBase} ${isFirst ? btnDisabled : btnEnabled}`}
        aria-label="이전 슬라이드"
      >
        ‹
      </button>

      {/* 현재/전체 */}
      <span className="px-3 text-sm font-semibold text-text tabular-nums">
        {selectedSlide}
        <span className="text-text-tertiary mx-0.5">/</span>
        {total}
      </span>

      {/* 다음 */}
      <button
        onClick={goNext}
        disabled={isLast}
        className={`${btnBase} ${isLast ? btnDisabled : btnEnabled}`}
        aria-label="다음 슬라이드"
      >
        ›
      </button>

      {/* 마지막 */}
      <button
        onClick={goLast}
        disabled={isLast}
        className={`${btnBase} ${isLast ? btnDisabled : btnEnabled}`}
        aria-label="마지막 슬라이드"
      >
        »
      </button>
    </div>
  );
}
