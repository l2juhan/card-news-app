import { create } from 'zustand';
import type {
  Slide,
  StyleName,
  StyleConfig,
  ProgressEvent,
} from '../../shared/types';

// -----------------------------------------------------------------------------
// Chat Message Types
// -----------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// -----------------------------------------------------------------------------
// Navigation Views
// -----------------------------------------------------------------------------

export type NavView = 'create' | 'history' | 'settings';

// -----------------------------------------------------------------------------
// Store State
// -----------------------------------------------------------------------------

interface CardNewsState {
  // -- 네비게이션 --
  currentView: NavView;
  setCurrentView: (view: NavView) => void;

  // -- 프로젝트 상태 --
  topic: string;
  style: StyleName;
  slideCount: number;
  slides: Slide[];
  imagePaths: string[];
  accentColor: string;

  // -- UI 상태 --
  selectedSlide: number;
  isGenerating: boolean;
  isEditing: boolean;
  progress: ProgressEvent | null;

  // -- 스타일 목록 --
  styles: Record<string, StyleConfig>;

  // -- 채팅 --
  messages: ChatMessage[];

  // -- 액션: 프로젝트 --
  setTopic: (topic: string) => void;
  setStyle: (style: StyleName) => void;
  setSlideCount: (count: number) => void;
  setAccentColor: (color: string) => void;

  // -- 액션: 슬라이드 --
  setSlides: (slides: Slide[], imagePaths: string[]) => void;
  updateSlideImage: (slideNumber: number, imagePath: string) => void;
  updateAllImages: (imagePaths: string[]) => void;
  selectSlide: (slideNumber: number) => void;

  // -- 액션: 생성/편집 상태 --
  setGenerating: (isGenerating: boolean) => void;
  setEditing: (isEditing: boolean) => void;
  setProgress: (progress: ProgressEvent | null) => void;

  // -- 액션: 스타일 목록 --
  setStyles: (styles: Record<string, StyleConfig>) => void;

  // -- 액션: 채팅 --
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;

  // -- 액션: 리셋 --
  resetProject: () => void;
}

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

let messageCounter = 0;

export const useCardNewsStore = create<CardNewsState>((set) => ({
  // -- 초기 상태 --
  currentView: 'create',
  topic: '',
  style: 'clean',
  slideCount: 7,
  slides: [],
  imagePaths: [],
  accentColor: '#6C5CE7',
  selectedSlide: 1,
  isGenerating: false,
  isEditing: false,
  progress: null,
  styles: {},
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: '어떤 카드뉴스를 만들어 드릴까요?\n주제를 입력하시면 AI가 자동으로 생성해 드립니다.',
      timestamp: Date.now(),
    },
  ],

  // -- 네비게이션 --
  setCurrentView: (view) => set({ currentView: view }),

  // -- 프로젝트 --
  setTopic: (topic) => set({ topic }),
  setStyle: (style) => set({ style }),
  setSlideCount: (count) => set({ slideCount: count }),
  setAccentColor: (color) => set({ accentColor: color }),

  // -- 슬라이드 --
  setSlides: (slides, imagePaths) =>
    set({ slides, imagePaths, selectedSlide: 1 }),

  updateSlideImage: (slideNumber, imagePath) =>
    set((state) => {
      const newPaths = [...state.imagePaths];
      newPaths[slideNumber - 1] = imagePath;
      return { imagePaths: newPaths };
    }),

  updateAllImages: (imagePaths) => set({ imagePaths }),

  selectSlide: (slideNumber) => set({ selectedSlide: slideNumber }),

  // -- 생성/편집 상태 --
  setGenerating: (isGenerating) => set({ isGenerating }),
  setEditing: (isEditing) => set({ isEditing }),
  setProgress: (progress) => set({ progress }),

  // -- 스타일 목록 --
  setStyles: (styles) => set({ styles }),

  // -- 채팅 --
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: `msg-${++messageCounter}`,
          timestamp: Date.now(),
        },
      ],
    })),

  clearMessages: () =>
    set({
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: '어떤 카드뉴스를 만들어 드릴까요?\n주제를 입력하시면 AI가 자동으로 생성해 드립니다.',
          timestamp: Date.now(),
        },
      ],
    }),

  // -- 리셋 --
  resetProject: () =>
    set({
      topic: '',
      style: 'clean',
      slideCount: 7,
      slides: [],
      imagePaths: [],
      accentColor: '#6C5CE7',
      selectedSlide: 1,
      isGenerating: false,
      isEditing: false,
      progress: null,
    }),
}));
