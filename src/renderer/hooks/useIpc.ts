import { useEffect } from 'react';
import { useCardNewsStore } from '../stores/useCardNewsStore';

/**
 * IPC 이벤트 리스너를 등록/해제하는 훅.
 * App 레벨에서 한 번만 호출하여 Main→Renderer 이벤트를 Zustand 스토어에 연결한다.
 * getState()를 사용하여 리스너가 한 번만 등록되도록 보장한다.
 */
export function useIpc() {
  useEffect(() => {
    const store = () => useCardNewsStore.getState();

    const unsubProgress = window.api.onProgress((event) => {
      store().setProgress(event);
    });

    const unsubGenerated = window.api.onGenerated((result) => {
      const s = store();
      s.setSlides(result.slides, result.imagePaths);
      s.setGenerating(false);
      s.setEditing(false);
      s.setProgress(null);
      s.addMessage({
        role: 'assistant',
        content: `${result.slides.length}장의 카드뉴스를 생성했습니다!\n수정이 필요하면 말씀해주세요.`,
      });
    });

    const unsubSlideUpdated = window.api.onSlideUpdated((slideNumber, imagePath) => {
      const s = store();
      s.updateSlideImage(slideNumber, imagePath);
      s.setEditing(false);
      s.setProgress(null);
      s.addMessage({
        role: 'assistant',
        content: `${slideNumber}번 슬라이드를 수정했습니다.`,
      });
    });

    const unsubRerendered = window.api.onSlidesRerendered((imagePaths) => {
      const s = store();
      s.updateAllImages(imagePaths);
      s.setEditing(false);
      s.setProgress(null);
    });

    const unsubExported = window.api.onExported((paths) => {
      const s = store();
      s.setProgress(null);
      s.addMessage({
        role: 'assistant',
        content: `${paths.length}개의 파일을 내보냈습니다.`,
      });
    });

    const unsubError = window.api.onError((error) => {
      const s = store();
      s.setGenerating(false);
      s.setEditing(false);
      s.setProgress(null);

      const msg = (error.message ?? '').toLowerCase();
      const isClaudeNotFound = msg.includes('enoent') && msg.includes('claude');
      s.addMessage({
        role: 'system',
        content: isClaudeNotFound
          ? 'Claude Code가 설치되어 있지 않거나 실행할 수 없습니다.\nhttps://claude.ai/code 에서 설치해주세요.'
          : `오류가 발생했습니다: ${error.message}`,
      });
    });

    return () => {
      unsubProgress();
      unsubGenerated();
      unsubSlideUpdated();
      unsubRerendered();
      unsubExported();
      unsubError();
    };
  }, []);

  // 스타일 목록 초기 로드
  useEffect(() => {
    const { setStyles } = useCardNewsStore.getState();
    window.api.getStyles().then(setStyles).catch(console.error);
  }, []);
}
