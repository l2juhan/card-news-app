import { useEffect } from 'react';
import { useCardNewsStore } from '../stores/useCardNewsStore';

/**
 * 전역 키보드 단축키 훅.
 */
export function useKeyboard() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const mod = e.metaKey || e.ctrlKey;

      // Cmd+E: 내보내기
      if (mod && e.key === 'e') {
        e.preventDefault();
        const { slides, isGenerating, isEditing } = useCardNewsStore.getState();
        if (slides.length > 0 && !isGenerating && !isEditing) {
          window.api.export({ format: 'png', resolution: { width: 1080, height: 1350 } });
        }
      }

      // Esc: 현재 포커스 해제
      if (e.key === 'Escape') {
        (document.activeElement as HTMLElement)?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
