// =============================================================================
// Card News App - Shared Type Definitions
// =============================================================================
// Main Process와 Renderer Process 간 공유 타입.
// config.json 및 slides.json 구조를 기반으로 정의.
// =============================================================================

// -----------------------------------------------------------------------------
// Slide Types
// -----------------------------------------------------------------------------

/** 공통 슬라이드 타입 14종 + CTA */
export type CommonSlideType =
  | 'cover'
  | 'content'
  | 'content-badge'
  | 'content-stat'
  | 'content-quote'
  | 'content-image'
  | 'content-steps'
  | 'content-list'
  | 'content-split'
  | 'content-highlight'
  | 'content-grid'
  | 'content-bigdata'
  | 'content-fullimage'
  | 'content-code'
  | 'cta';

/** rn 스타일 전용 슬라이드 타입 5종 */
export type RnSlideType =
  | 'content-install'
  | 'content-table'
  | 'content-code-desc'
  | 'content-grid-table'
  | 'content-compare-image';

/** 모든 슬라이드 타입 */
export type SlideType = CommonSlideType | RnSlideType;

// -----------------------------------------------------------------------------
// Slide Data
// -----------------------------------------------------------------------------

/** 슬라이드 데이터 (slides.json의 단일 항목) */
export interface Slide {
  /** 슬라이드 번호 (1-based) */
  slide: number;
  /** 슬라이드 타입 */
  type: SlideType;
  /** 제목 */
  headline: string;

  // -- 공통 옵셔널 필드 --
  body?: string;
  subtext?: string;
  emphasis?: string;
  image_url?: string;

  // -- content-code --
  code_body?: string;
  code_filename?: string;

  // -- content-badge --
  badge_text?: string;
  badge2_text?: string;
  body2?: string;

  // -- content-steps --
  step1?: string;
  step2?: string;
  step3?: string;

  // -- content-list --
  item1?: string;
  item2?: string;
  item3?: string;
  item4?: string;
  item5?: string;

  // -- content-split --
  left_title?: string;
  left_body?: string;
  right_title?: string;
  right_body?: string;

  // -- content-compare-image --
  left_image?: string;
  right_image?: string;

  // -- content-grid (최대 4칸) --
  grid1_icon?: string;
  grid1_title?: string;
  grid1_desc?: string;
  grid2_icon?: string;
  grid2_title?: string;
  grid2_desc?: string;
  grid3_icon?: string;
  grid3_title?: string;
  grid3_desc?: string;
  grid4_icon?: string;
  grid4_title?: string;
  grid4_desc?: string;

  // -- content-bigdata --
  bigdata_number?: string;
  bigdata_unit?: string;

  // -- cta --
  cta_text?: string;
}

// -----------------------------------------------------------------------------
// Style & Config
// -----------------------------------------------------------------------------

/** 12개 스타일 이름 */
export type StyleName =
  | 'minimal'
  | 'bold'
  | 'elegant'
  | 'premium'
  | 'toss'
  | 'magazine'
  | 'clean'
  | 'blueprint'
  | 'aws'
  | 'rn'
  | 'cs'
  | 'linux';

/** 스타일 설정 (config.json의 templates 항목) */
export interface StyleConfig {
  description: string;
  accent_color: string;
  background: string;
}

/** 해상도 */
export interface Dimensions {
  width: number;
  height: number;
}

/** config.json 전체 구조 */
export interface AppConfig {
  version: string;
  defaults: {
    template: StyleName;
    accent_color: string;
    account_name: string;
    slide_count: number;
  };
  templates: Record<StyleName, StyleConfig>;
  dimensions: Dimensions;
  style_dimensions: Partial<Record<StyleName, Dimensions>>;
  output_dir: string;
  workspace_dir: string;
}

// -----------------------------------------------------------------------------
// Project State
// -----------------------------------------------------------------------------

/** 카드뉴스 프로젝트 상태 */
export interface CardNewsProject {
  id: string;
  topic: string;
  style: StyleName;
  slides: Slide[];
  accentColor: string;
  accountName: string;
  createdAt: string;
  outputDir: string;
}

// -----------------------------------------------------------------------------
// Rendering
// -----------------------------------------------------------------------------

/** Puppeteer 렌더링 옵션 */
export interface RenderOptions {
  style: StyleName;
  outputDir: string;
  accent?: string;
  account?: string;
}

// -----------------------------------------------------------------------------
// IPC Request / Response Types
// -----------------------------------------------------------------------------

/** 카드뉴스 생성 요청 */
export interface GenerateRequest {
  topic: string;
  style: StyleName;
  slideCount: number;
  tone?: string;
  accentColor?: string;
}

/** AI 기반 슬라이드 편집 요청 */
export interface EditRequest {
  slideNumber: number;
  instruction: string;
}

/** 직접 편집 요청 (AI 미호출, JSON 필드 변경 후 재렌더링) */
export interface DirectEditRequest {
  slideNumber: number;
  changes: Partial<Slide>;
}

/** PNG 내보내기 요청 */
export interface ExportRequest {
  format: 'png';
  resolution: Dimensions;
}

/** 진행 상태 이벤트 (Main -> Renderer) */
export interface ProgressEvent {
  status: string;
  percent: number;
}

/** 카드뉴스 생성/편집 결과 (Main -> Renderer) */
export interface CardNewsResult {
  slides: Slide[];
  imagePaths: string[];
}

/** 오류 이벤트 (Main -> Renderer) */
export interface ErrorEvent {
  message: string;
  code?: string;
}

// -----------------------------------------------------------------------------
// IPC Channel Names
// -----------------------------------------------------------------------------

/** IPC 채널명 상수 */
export const IPC_CHANNELS = {
  // Renderer -> Main (invoke)
  GENERATE: 'card-news:generate',
  EDIT: 'card-news:edit',
  DIRECT_EDIT: 'card-news:direct-edit',
  CHANGE_STYLE: 'card-news:change-style',
  REORDER_SLIDES: 'card-news:reorder-slides',
  EXPORT: 'card-news:export',
  GET_STYLES: 'card-news:get-styles',

  // Main -> Renderer (send)
  PROGRESS: 'card-news:progress',
  GENERATED: 'card-news:generated',
  SLIDE_UPDATED: 'card-news:slide-updated',
  SLIDES_RERENDERED: 'card-news:slides-rerendered',
  EXPORTED: 'card-news:exported',
  ERROR: 'card-news:error',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

// -----------------------------------------------------------------------------
// Preload API (window.api)
// -----------------------------------------------------------------------------

/** preload에서 contextBridge로 노출하는 API 인터페이스 */
export interface IpcApi {
  // -- 요청 (Renderer -> Main) --

  /** 카드뉴스 생성 */
  generate(request: GenerateRequest): Promise<void>;

  /** AI 기반 슬라이드 편집 */
  edit(request: EditRequest): Promise<void>;

  /** 직접 편집 (AI 미호출) */
  directEdit(request: DirectEditRequest): Promise<void>;

  /** 스타일 일괄 변경 */
  changeStyle(newStyle: StyleName): Promise<void>;

  /** 슬라이드 순서 변경 */
  reorderSlides(newOrder: number[]): Promise<void>;

  /** PNG 내보내기 */
  export(request: ExportRequest): Promise<void>;

  /** 사용 가능한 스타일 목록 조회 */
  getStyles(): Promise<Record<StyleName, StyleConfig>>;

  // -- 이벤트 수신 (Main -> Renderer) --

  /** 진행 상태 수신 */
  onProgress(callback: (event: ProgressEvent) => void): () => void;

  /** 생성 완료 수신 */
  onGenerated(callback: (result: CardNewsResult) => void): () => void;

  /** 단일 슬라이드 업데이트 수신 */
  onSlideUpdated(
    callback: (slideNumber: number, imagePath: string) => void,
  ): () => void;

  /** 일괄 재렌더링 완료 수신 */
  onSlidesRerendered(callback: (imagePaths: string[]) => void): () => void;

  /** 내보내기 완료 수신 */
  onExported(callback: (paths: string[]) => void): () => void;

  /** 오류 수신 */
  onError(callback: (error: ErrorEvent) => void): () => void;
}

// -----------------------------------------------------------------------------
// Window 타입 확장 (Renderer에서 window.api 사용 시)
// -----------------------------------------------------------------------------

declare global {
  interface Window {
    api: IpcApi;
  }
}
