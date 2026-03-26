import { useCallback } from 'react';
import { useCardNewsStore } from '../stores/useCardNewsStore';

/**
 * 내보내기 로직 훅.
 */
export function useExport() {
  const exportAll = useCallback(async (width = 1080, height = 1350) => {
    const { slides, isGenerating, isEditing } = useCardNewsStore.getState();
    if (isGenerating || isEditing || slides.length === 0) return;

    try {
      await window.api.export({ format: 'png', resolution: { width, height } });
    } catch {
      useCardNewsStore.getState().addMessage({
        role: 'system',
        content: '내보내기에 실패했습니다.',
      });
    }
  }, []);

  return { exportAll };
}
