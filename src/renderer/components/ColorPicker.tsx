import { useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Preset Colors
// ---------------------------------------------------------------------------

const PRESET_COLORS = [
  '#6C5CE7',
  '#0984E3',
  '#00B894',
  '#FDCB6E',
  '#E17055',
  '#D63031',
  '#636E72',
  '#2D3436',
  '#A29BFE',
  '#74B9FF',
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [customHex, setCustomHex] = useState('');

  const normalizedValue = value.toUpperCase();

  const handleCustomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let raw = e.target.value;

      // 항상 #으로 시작하도록
      if (!raw.startsWith('#')) {
        raw = '#' + raw;
      }

      // # + 최대 6자리 hex 문자만 허용
      const cleaned = '#' + raw.slice(1).replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
      setCustomHex(cleaned);

      // 유효한 HEX일 때만 반영 (#RGB 또는 #RRGGBB)
      if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(cleaned)) {
        onChange(cleaned.toUpperCase());
      }
    },
    [onChange],
  );

  const handlePresetClick = useCallback(
    (color: string) => {
      setCustomHex('');
      onChange(color);
    },
    [onChange],
  );

  return (
    <div className="flex flex-col gap-2">
      {/* 프리셋 팔레트 */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((color) => {
          const isSelected = normalizedValue === color.toUpperCase();
          return (
            <button
              key={color}
              type="button"
              onClick={() => handlePresetClick(color)}
              className="relative w-6 h-6 rounded-full border border-border transition-transform hover:scale-110 cursor-pointer flex items-center justify-center"
              style={{ backgroundColor: color }}
              aria-label={`색상 ${color}`}
              title={color}
            >
              {isSelected && (
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.5 8.5L6.5 11.5L12.5 4.5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* 커스텀 HEX 입력 */}
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded border border-border shrink-0"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={customHex || value}
          onChange={handleCustomChange}
          placeholder="#6C5CE7"
          maxLength={7}
          className="flex-1 h-7 px-2 text-xs font-mono rounded border border-border bg-surface
                     text-text placeholder:text-text-tertiary
                     focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
        />
      </div>
    </div>
  );
}
