import { useState, useCallback, useMemo, useEffect } from 'react';
import { useCardNewsStore } from '../stores/useCardNewsStore';
import { ColorPicker } from './ColorPicker';
import type { Slide, SlideType, StyleName } from '../../shared/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SLIDE_TYPES: { value: SlideType; label: string }[] = [
  { value: 'cover', label: 'Cover' },
  { value: 'content', label: 'Content' },
  { value: 'content-badge', label: 'Badge' },
  { value: 'content-stat', label: 'Stat' },
  { value: 'content-quote', label: 'Quote' },
  { value: 'content-image', label: 'Image' },
  { value: 'content-steps', label: 'Steps' },
  { value: 'content-list', label: 'List' },
  { value: 'content-split', label: 'Split' },
  { value: 'content-highlight', label: 'Highlight' },
  { value: 'content-grid', label: 'Grid' },
  { value: 'content-bigdata', label: 'Big Data' },
  { value: 'content-fullimage', label: 'Full Image' },
  { value: 'content-code', label: 'Code' },
  { value: 'cta', label: 'CTA' },
  { value: 'content-install', label: 'Install (RN)' },
  { value: 'content-table', label: 'Table (RN)' },
  { value: 'content-code-desc', label: 'Code Desc (RN)' },
  { value: 'content-grid-table', label: 'Grid Table (RN)' },
  { value: 'content-compare-image', label: 'Compare Image (RN)' },
];

const STYLE_OPTIONS: { value: StyleName; label: string }[] = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'bold', label: 'Bold' },
  { value: 'elegant', label: 'Elegant' },
  { value: 'premium', label: 'Premium' },
  { value: 'toss', label: 'Toss' },
  { value: 'magazine', label: 'Magazine' },
  { value: 'clean', label: 'Clean' },
  { value: 'blueprint', label: 'Blueprint' },
  { value: 'aws', label: 'AWS' },
  { value: 'rn', label: 'React Native' },
  { value: 'cs', label: 'CS' },
  { value: 'linux', label: 'Linux' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SlideEditor() {
  const slides = useCardNewsStore((s) => s.slides);
  const selectedSlide = useCardNewsStore((s) => s.selectedSlide);
  const style = useCardNewsStore((s) => s.style);
  const accentColor = useCardNewsStore((s) => s.accentColor);
  const isEditing = useCardNewsStore((s) => s.isEditing);
  const isGenerating = useCardNewsStore((s) => s.isGenerating);
  const setStyle = useCardNewsStore((s) => s.setStyle);
  const setAccentColor = useCardNewsStore((s) => s.setAccentColor);
  const setEditing = useCardNewsStore((s) => s.setEditing);

  const [isOpen, setIsOpen] = useState(false);

  // 현재 선택된 슬라이드
  const currentSlide = useMemo(
    () => slides.find((s) => s.slide === selectedSlide) ?? null,
    [slides, selectedSlide],
  );

  // 로컬 편집 상태 (적용 전까지 store를 직접 수정하지 않음)
  const [localHeadline, setLocalHeadline] = useState('');
  const [localBody, setLocalBody] = useState('');
  const [localSubtext, setLocalSubtext] = useState('');
  const [localEmphasis, setLocalEmphasis] = useState('');
  const [localType, setLocalType] = useState<SlideType>('content');

  // 슬라이드가 바뀔 때 로컬 상태 동기화
  useEffect(() => {
    if (currentSlide) {
      setLocalHeadline(currentSlide.headline);
      setLocalBody(currentSlide.body ?? '');
      setLocalSubtext(currentSlide.subtext ?? '');
      setLocalEmphasis(currentSlide.emphasis ?? '');
      setLocalType(currentSlide.type);
    }
  }, [currentSlide]);

  // 변경사항이 있는지 확인
  const hasChanges = useMemo(() => {
    if (!currentSlide) return false;
    return (
      localHeadline !== currentSlide.headline ||
      localBody !== (currentSlide.body ?? '') ||
      localSubtext !== (currentSlide.subtext ?? '') ||
      localEmphasis !== (currentSlide.emphasis ?? '') ||
      localType !== currentSlide.type
    );
  }, [currentSlide, localHeadline, localBody, localSubtext, localEmphasis, localType]);

  // 적용 버튼
  const handleApply = useCallback(async () => {
    if (!currentSlide || !hasChanges) return;

    const changes: Partial<Slide> = {};

    if (localHeadline !== currentSlide.headline) {
      changes.headline = localHeadline;
    }
    if (localBody !== (currentSlide.body ?? '')) {
      changes.body = localBody || undefined;
    }
    if (localSubtext !== (currentSlide.subtext ?? '')) {
      changes.subtext = localSubtext || undefined;
    }
    if (localEmphasis !== (currentSlide.emphasis ?? '')) {
      changes.emphasis = localEmphasis || undefined;
    }
    if (localType !== currentSlide.type) {
      changes.type = localType;
    }

    try {
      setEditing(true);
      await window.api.directEdit({
        slideNumber: selectedSlide,
        changes,
      });
    } catch {
      // 에러는 onError 이벤트로 수신됨
    } finally {
      setEditing(false);
    }
  }, [currentSlide, selectedSlide, localHeadline, localBody, localSubtext, localEmphasis, localType, hasChanges, setEditing]);

  // 스타일 변경 (전체 슬라이드 일괄)
  const handleStyleChange = useCallback(
    async (newStyle: StyleName) => {
      setStyle(newStyle);
      try {
        setEditing(true);
        await window.api.changeStyle(newStyle);
      } catch {
        // 에러는 onError 이벤트로 수신됨
      } finally {
        setEditing(false);
      }
    },
    [setStyle, setEditing],
  );

  // 슬라이드가 없으면 표시 안 함
  if (slides.length === 0) return null;

  const isBusy = isEditing || isGenerating;

  return (
    <div className="border-t border-border bg-surface">
      {/* 토글 헤더 */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium
                   text-text-secondary hover:text-text hover:bg-surface-secondary
                   transition-colors cursor-pointer select-none"
      >
        <span>
          직접 편집
          {currentSlide && (
            <span className="ml-1.5 text-text-tertiary">
              — 슬라이드 {selectedSlide} ({currentSlide.type})
            </span>
          )}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* 편집 패널 본문 */}
      {isOpen && currentSlide && (
        <div className="px-4 pb-3 space-y-3 max-h-64 overflow-y-auto">
          {/* 1행: 슬라이드 타입 + 스타일 */}
          <div className="grid grid-cols-2 gap-2">
            {/* 슬라이드 타입 */}
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                타입
              </span>
              <select
                value={localType}
                onChange={(e) => setLocalType(e.target.value as SlideType)}
                disabled={isBusy}
                className="h-7 px-2 text-xs rounded border border-border bg-surface text-text
                           focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {SLIDE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            {/* 스타일 (전체 일괄 변경) */}
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                스타일 (전체)
              </span>
              <select
                value={style}
                onChange={(e) => handleStyleChange(e.target.value as StyleName)}
                disabled={isBusy}
                className="h-7 px-2 text-xs rounded border border-border bg-surface text-text
                           focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {STYLE_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Headline */}
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
              Headline
            </span>
            <input
              type="text"
              value={localHeadline}
              onChange={(e) => setLocalHeadline(e.target.value)}
              disabled={isBusy}
              placeholder="제목을 입력하세요"
              className="h-7 px-2 text-xs rounded border border-border bg-surface text-text
                         placeholder:text-text-tertiary
                         focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>

          {/* Body */}
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
              Body
            </span>
            <textarea
              value={localBody}
              onChange={(e) => setLocalBody(e.target.value)}
              disabled={isBusy}
              placeholder="본문 내용"
              rows={2}
              className="px-2 py-1.5 text-xs rounded border border-border bg-surface text-text
                         placeholder:text-text-tertiary resize-none
                         focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>

          {/* Subtext + Emphasis */}
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                Subtext
              </span>
              <input
                type="text"
                value={localSubtext}
                onChange={(e) => setLocalSubtext(e.target.value)}
                disabled={isBusy}
                placeholder="부제/소제목"
                className="h-7 px-2 text-xs rounded border border-border bg-surface text-text
                           placeholder:text-text-tertiary
                           focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30
                           disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
                Emphasis
              </span>
              <input
                type="text"
                value={localEmphasis}
                onChange={(e) => setLocalEmphasis(e.target.value)}
                disabled={isBusy}
                placeholder="강조 텍스트"
                className="h-7 px-2 text-xs rounded border border-border bg-surface text-text
                           placeholder:text-text-tertiary
                           focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30
                           disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </label>
          </div>

          {/* Accent Color */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">
              Accent Color
            </span>
            <ColorPicker value={accentColor} onChange={setAccentColor} />
          </div>

          {/* 적용 버튼 */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleApply}
              disabled={isBusy || !hasChanges}
              className="px-4 h-7 text-xs font-medium rounded
                         bg-primary text-white
                         hover:bg-primary-dark active:bg-primary-dark
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors cursor-pointer"
            >
              {isEditing ? '적용 중...' : '적용'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
