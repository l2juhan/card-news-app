import { useCardNewsStore } from '../stores/useCardNewsStore';
import { PhoneMockup } from './PhoneMockup';
import { SlideNavigator } from './SlideNavigator';
import { SlideEditor } from './SlideEditor';
import { SlideGrid } from './SlideGrid';
import { ExportButton } from './ExportButton';

export function PreviewPanel() {
  const slides = useCardNewsStore((s) => s.slides);
  const hasSlides = slides.length > 0;

  return (
    <div className="flex flex-col h-full bg-surface-secondary">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border shrink-0">
        <div className="flex items-center">
          <h2 className="text-sm font-semibold text-text">미리보기</h2>
          {hasSlides && (
            <span className="ml-2 text-xs text-text-tertiary">
              {slides.length}장
            </span>
          )}
        </div>
        <ExportButton />
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto">
        {hasSlides ? (
          <div className="flex flex-col items-center py-6 gap-2">
            {/* 폰 목업 */}
            <PhoneMockup />

            {/* 슬라이드 네비게이터 */}
            <SlideNavigator />

            {/* 슬라이드 그리드 (드래그 앤 드롭) */}
            <SlideGrid />

            {/* 직접 편집 패널 */}
            <div className="w-full px-4">
              <SlideEditor />
            </div>
          </div>
        ) : (
          /* 빈 상태 안내 */
          <div className="flex flex-col items-center justify-center h-full px-8 text-center">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-surface-tertiary flex items-center justify-center">
              <svg
                className="w-8 h-8 text-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-text-secondary mb-1">
              카드뉴스를 생성하면
            </p>
            <p className="text-sm font-medium text-text-secondary">
              여기에 미리보기가 표시됩니다
            </p>
            <p className="text-xs text-text-tertiary mt-3">
              왼쪽 채팅에서 주제를 입력해 보세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
