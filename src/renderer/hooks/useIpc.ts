import { useEffect } from 'react';
import { useCardNewsStore } from '../stores/useCardNewsStore';

/**
 * IPC 이벤트 리스너를 등록/해제하는 훅.
 * App 레벨에서 한 번만 호출하여 Main→Renderer 이벤트를 Zustand 스토어에 연결한다.
 */
export function useIpc() {
  const {
    setSlides,
    updateSlideImage,
    updateAllImages,
    setProgress,
    setGenerating,
    setEditing,
    addMessage,
  } = useCardNewsStore();

  useEffect(() => {
    const unsubProgress = window.api.onProgress((event) => {
      setProgress(event);
    });

    const unsubGenerated = window.api.onGenerated((result) => {
      setSlides(result.slides, result.imagePaths);
      setGenerating(false);
      setProgress(null);
      addMessage({
        role: 'assistant',
        content: `${result.slides.length}장의 카드뉴스를 생성했습니다!\n수정이 필요하면 말씀해주세요.`,
      });
    });

    const unsubSlideUpdated = window.api.onSlideUpdated((slideNumber, imagePath) => {
      updateSlideImage(slideNumber, imagePath);
      setEditing(false);
      setProgress(null);
      addMessage({
        role: 'assistant',
        content: `${slideNumber}번 슬라이드를 수정했습니다.`,
      });
    });

    const unsubRerendered = window.api.onSlidesRerendered((imagePaths) => {
      updateAllImages(imagePaths);
      setEditing(false);
      setProgress(null);
    });

    const unsubExported = window.api.onExported((paths) => {
      setProgress(null);
      addMessage({
        role: 'assistant',
        content: `${paths.length}개의 파일을 내보냈습니다.`,
      });
    });

    const unsubError = window.api.onError((error) => {
      setGenerating(false);
      setEditing(false);
      setProgress(null);
      addMessage({
        role: 'system',
        content: `오류가 발생했습니다: ${error.message}`,
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
  }, [
    setSlides,
    updateSlideImage,
    updateAllImages,
    setProgress,
    setGenerating,
    setEditing,
    addMessage,
  ]);

  // 스타일 목록 초기 로드
  useEffect(() => {
    const { setStyles } = useCardNewsStore.getState();
    window.api.getStyles().then(setStyles).catch(console.error);
  }, []);
}
