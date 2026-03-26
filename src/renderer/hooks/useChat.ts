import { useCallback } from 'react';
import { useCardNewsStore } from '../stores/useCardNewsStore';
import type { StyleName } from '../../shared/types';

/**
 * 채팅 메시지 전송 및 IPC 요청을 연결하는 훅.
 */
export function useChat() {
  const {
    style,
    slideCount,
    slides,
    isGenerating,
    isEditing,
    addMessage,
    setGenerating,
    setEditing,
  } = useCardNewsStore();

  /** 카드뉴스 생성 요청 */
  const generate = useCallback(
    async (topic: string, overrideStyle?: StyleName, overrideCount?: number) => {
      if (isGenerating || isEditing) return;

      addMessage({ role: 'user', content: topic });
      setGenerating(true);

      try {
        await window.api.generate({
          topic,
          style: overrideStyle ?? style,
          slideCount: overrideCount ?? slideCount,
        });
      } catch {
        setGenerating(false);
        addMessage({
          role: 'system',
          content: '생성 요청에 실패했습니다. 다시 시도해주세요.',
        });
      }
    },
    [style, slideCount, isGenerating, isEditing, addMessage, setGenerating],
  );

  /** AI 기반 슬라이드 편집 요청 */
  const edit = useCallback(
    async (instruction: string, slideNumber?: number) => {
      if (isGenerating || isEditing) return;
      if (slides.length === 0) {
        addMessage({
          role: 'system',
          content: '먼저 카드뉴스를 생성해주세요.',
        });
        return;
      }

      addMessage({ role: 'user', content: instruction });
      setEditing(true);

      const targetSlide = slideNumber ?? useCardNewsStore.getState().selectedSlide;
      try {
        await window.api.edit({ slideNumber: targetSlide, instruction });
      } catch {
        setEditing(false);
        addMessage({
          role: 'system',
          content: '수정 요청에 실패했습니다. 다시 시도해주세요.',
        });
      }
    },
    [slides.length, isGenerating, isEditing, addMessage, setEditing],
  );

  /** 채팅 메시지 전송 (생성 또는 수정 자동 판별) */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (slides.length === 0) {
        await generate(trimmed);
      } else {
        await edit(trimmed);
      }
    },
    [slides.length, generate, edit],
  );

  return { sendMessage, generate, edit };
}
