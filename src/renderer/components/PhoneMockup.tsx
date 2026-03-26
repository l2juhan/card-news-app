import { useMemo } from 'react';
import { useCardNewsStore } from '../stores/useCardNewsStore';

export function PhoneMockup() {
  const imagePaths = useCardNewsStore((s) => s.imagePaths);
  const selectedSlide = useCardNewsStore((s) => s.selectedSlide);
  const slides = useCardNewsStore((s) => s.slides);

  const total = slides.length;
  const currentImage = imagePaths[selectedSlide - 1] ?? null;

  // 현재 시간 표시 (정적, 마운트 시점 고정)
  const timeStr = useMemo(() => {
    const now = new Date();
    return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  }, []);

  // 캐러셀 닷 인디케이터 (최대 표시 개수 제한)
  const dots = useMemo(() => {
    if (total <= 0) return null;
    const maxVisible = 9;
    const showDots = total <= maxVisible;

    if (showDots) {
      return (
        <div className="flex items-center justify-center gap-[5px] py-2">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`block rounded-full transition-colors ${
                i + 1 === selectedSlide
                  ? 'w-[6px] h-[6px] bg-[#3897F0]'
                  : 'w-[5px] h-[5px] bg-[#C7C7CC]'
              }`}
            />
          ))}
        </div>
      );
    }

    // 슬라이드가 많으면 숫자로 표시
    return (
      <div className="flex items-center justify-center py-2">
        <span className="text-[11px] text-text-secondary tabular-nums">
          {selectedSlide} / {total}
        </span>
      </div>
    );
  }, [total, selectedSlide]);

  return (
    <div className="flex flex-col items-center">
      {/* 아이폰 프레임 */}
      <div
        className="relative bg-black rounded-[40px] p-[10px] shadow-xl"
        style={{ width: 300 }}
      >
        {/* 내부 스크린 */}
        <div className="bg-white rounded-[30px] overflow-hidden">
          {/* ── 상단 상태바 ── */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1">
            <span className="text-[12px] font-semibold text-text">
              {timeStr}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-text">
              <span>●●●</span>
              <span className="ml-0.5">WiFi</span>
              <svg
                className="w-[18px] h-[10px] ml-0.5"
                viewBox="0 0 25 12"
                fill="none"
              >
                <rect
                  x="0"
                  y="1"
                  width="21"
                  height="10"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <rect x="2" y="3" width="15" height="6" rx="1" fill="currentColor" />
                <rect x="22" y="4.5" width="2.5" height="3" rx="0.5" fill="currentColor" />
              </svg>
            </div>
          </div>

          {/* ── Instagram 프로필 바 ── */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border-light">
            {/* 프로필 아이콘 */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] p-[2px]">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <div className="w-[26px] h-[26px] rounded-full bg-surface-tertiary" />
              </div>
            </div>
            <span className="text-[13px] font-semibold text-text flex-1">
              card_news
            </span>
            <button className="text-text text-lg leading-none px-1">⋯</button>
          </div>

          {/* ── 카드뉴스 이미지 영역 ── */}
          <div
            className="relative bg-surface-tertiary"
            style={{ aspectRatio: '1 / 1' }}
          >
            {currentImage ? (
              <img
                src={
                  currentImage.startsWith('file://')
                    ? currentImage
                    : `file://${currentImage}`
                }
                alt={`슬라이드 ${selectedSlide}`}
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-text-tertiary">
                <svg
                  className="w-12 h-12 mb-2 opacity-40"
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
                <span className="text-xs">이미지 없음</span>
              </div>
            )}
          </div>

          {/* ── Instagram 액션바 ── */}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-4 text-[20px]">
              <span className="cursor-pointer hover:opacity-60 transition-opacity">
                ♡
              </span>
              <span className="cursor-pointer hover:opacity-60 transition-opacity">
                💬
              </span>
              <span className="cursor-pointer hover:opacity-60 transition-opacity">
                ✈
              </span>
            </div>
            <span className="text-[20px] cursor-pointer hover:opacity-60 transition-opacity">
              🔖
            </span>
          </div>

          {/* ── 캐러셀 닷 인디케이터 ── */}
          {dots}

          {/* ── 좋아요 수 ── */}
          <div className="px-3 pb-1">
            <span className="text-[13px] font-semibold text-text">
              좋아요 1,234개
            </span>
          </div>

          {/* ── 하단 탭바 ── */}
          <div className="flex items-center justify-around border-t border-border-light py-2 mt-2">
            <span className="text-[18px]">🏠</span>
            <span className="text-[18px]">🔍</span>
            <span className="text-[18px]">➕</span>
            <span className="text-[18px]">🎬</span>
            <span className="text-[18px]">👤</span>
          </div>
        </div>
      </div>
    </div>
  );
}
