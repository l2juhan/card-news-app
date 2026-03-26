import { useCallback } from 'react';
import { useCardNewsStore } from '../stores/useCardNewsStore';
import type { StyleName } from '../../shared/types';

/**
 * 채팅 메시지 전송 및 IPC 요청을 연결하는 훅.
 * getState()를 사용하여 stale closure를 방지한다.
 */
export function useChat() {
  /** 카드뉴스 생성 요청 */
  const generate = useCallback(
    async (topic: string, overrideStyle?: StyleName, overrideCount?: number) => {
      const s = useCardNewsStore.getState();
      if (s.isGenerating || s.isEditing) return;

      s.addMessage({ role: 'user', content: topic });
      s.setGenerating(true);

      try {
        await window.api.generate({
          topic,
          style: overrideStyle ?? s.style,
          slideCount: overrideCount ?? s.slideCount,
        });
      } catch {
        useCardNewsStore.getState().setGenerating(false);
        useCardNewsStore.getState().addMessage({
          role: 'system',
          content: '생성 요청에 실패했습니다. 다시 시도해주세요.',
        });
      }
    },
    [],
  );

  /** AI 기반 슬라이드 편집 요청 */
  const edit = useCallback(
    async (instruction: string, slideNumber?: number) => {
      const s = useCardNewsStore.getState();
      if (s.isGenerating || s.isEditing) return;
      if (s.slides.length === 0) {
        s.addMessage({
          role: 'system',
          content: '먼저 카드뉴스를 생성해주세요.',
        });
        return;
      }

      s.addMessage({ role: 'user', content: instruction });
      s.setEditing(true);

      const targetSlide = slideNumber ?? s.selectedSlide;
      try {
        await window.api.edit({ slideNumber: targetSlide, instruction });
      } catch {
        useCardNewsStore.getState().setEditing(false);
        useCardNewsStore.getState().addMessage({
          role: 'system',
          content: '수정 요청에 실패했습니다. 다시 시도해주세요.',
        });
      }
    },
    [],
  );

  /** 채팅 메시지 전송 (생성 또는 수정 자동 판별) */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const { slides } = useCardNewsStore.getState();
      if (slides.length === 0) {
        await generate(trimmed);
      } else {
        await edit(trimmed);
      }
    },
    [generate, edit],
  );

  return { sendMessage, generate, edit };
}
