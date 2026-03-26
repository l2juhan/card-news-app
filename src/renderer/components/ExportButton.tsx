import { useState, useEffect, useCallback } from 'react';
import { useCardNewsStore } from '../stores/useCardNewsStore';
import { useExport } from '../hooks/useExport';

const RESOLUTIONS = [
  { label: '4:5 (1080x1350)', width: 1080, height: 1350 },
  { label: '1:1 (1080x1080)', width: 1080, height: 1080 },
] as const;

export function ExportButton() {
  const slides = useCardNewsStore((s) => s.slides);
  const isGenerating = useCardNewsStore((s) => s.isGenerating);
  const isEditing = useCardNewsStore((s) => s.isEditing);
  const { exportAll } = useExport();
  const [showMenu, setShowMenu] = useState(false);

  // Esc로 메뉴 닫기
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setShowMenu(false);
  }, []);

  useEffect(() => {
    if (showMenu) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showMenu, handleKeyDown]);

  if (slides.length === 0) return null;

  const isBusy = isGenerating || isEditing;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowMenu((prev) => !prev)}
        disabled={isBusy}
        className="flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-lg
                   bg-primary text-white hover:bg-primary-dark
                   disabled:opacity-40 disabled:cursor-not-allowed
                   transition-colors cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        내보내기
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 bottom-full mb-1 z-20 w-48 py-1 bg-surface rounded-lg shadow-lg border border-border">
            {RESOLUTIONS.map((res) => (
              <button
                key={res.label}
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  exportAll(res.width, res.height);
                }}
                className="w-full px-3 py-2 text-left text-xs text-text hover:bg-surface-secondary transition-colors cursor-pointer"
              >
                <span className="font-medium">PNG {res.label}</span>
                <span className="block text-text-tertiary mt-0.5">{slides.length}장 일괄 내보내기</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
