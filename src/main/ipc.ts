import { ipcMain, BrowserWindow, dialog } from 'electron';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import {
  IPC_CHANNELS,
  type GenerateRequest,
  type EditRequest,
  type DirectEditRequest,
  type ExportRequest,
  type StyleName,
  type StyleConfig,
  type Slide,
  type AppConfig,
} from '../shared/types';
import { generateCardNews, editCardNews, changeStyle } from './claude';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROJECT_ROOT = path.resolve(__dirname, '../..');

function getConfig(): AppConfig {
  const configPath = path.join(PROJECT_ROOT, 'config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function getSlidesPath(): string {
  const config = getConfig();
  return path.join(PROJECT_ROOT, config.workspace_dir, 'slides.json');
}

function getOutputDir(): string {
  const config = getConfig();
  return path.join(PROJECT_ROOT, config.output_dir);
}

function readSlides(): Slide[] {
  const slidesPath = getSlidesPath();
  if (!fs.existsSync(slidesPath)) return [];
  return JSON.parse(fs.readFileSync(slidesPath, 'utf8'));
}

function writeSlides(slides: Slide[]): void {
  const slidesPath = getSlidesPath();
  fs.mkdirSync(path.dirname(slidesPath), { recursive: true });
  fs.writeFileSync(slidesPath, JSON.stringify(slides, null, 2), 'utf8');
}

function getImagePaths(): string[] {
  const outputDir = getOutputDir();
  if (!fs.existsSync(outputDir)) return [];
  return fs
    .readdirSync(outputDir)
    .filter((f) => f.startsWith('slide_') && f.endsWith('.png'))
    .sort()
    .map((f) => path.join(outputDir, f));
}

/** 메인 윈도우에 이벤트 전송 */
function sendToRenderer(channel: string, ...args: unknown[]): void {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    windows[0].webContents.send(channel, ...args);
  }
}

/** 렌더링 실행 (render.js를 child_process로 호출) */
async function runRender(
  style: StyleName,
  accent?: string,
  account?: string,
): Promise<string[]> {
  const execFileAsync = promisify(execFile);
  const config = getConfig();
  const renderScript = path.join(PROJECT_ROOT, 'scripts', 'render.js');
  const slidesPath = getSlidesPath();
  const outputDir = getOutputDir();

  const args = [
    renderScript,
    '--slides',
    slidesPath,
    '--style',
    style,
    '--output',
    outputDir,
  ];

  if (accent) {
    args.push('--accent', accent);
  }
  if (account) {
    args.push('--account', account);
  }

  await execFileAsync('node', args, { cwd: PROJECT_ROOT });
  return getImagePaths();
}

// ---------------------------------------------------------------------------
// Abort Controller 관리
// ---------------------------------------------------------------------------

let currentAbortController: AbortController | null = null;

function createAbortController(): AbortController {
  // 이전 작업이 있으면 중단
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();
  return currentAbortController;
}

// ---------------------------------------------------------------------------
// IPC Handlers
// ---------------------------------------------------------------------------

export function registerIpcHandlers(): void {
  // --- card-news:generate ---
  ipcMain.handle(IPC_CHANNELS.GENERATE, async (_event, request: GenerateRequest) => {
    const abortController = createAbortController();

    const callbacks = {
      onProgress: (status: string, percent: number) => {
        sendToRenderer(IPC_CHANNELS.PROGRESS, { status, percent });
      },
      onError: (message: string) => {
        sendToRenderer(IPC_CHANNELS.ERROR, { message });
      },
    };

    try {
      sendToRenderer(IPC_CHANNELS.PROGRESS, { status: '카드뉴스 생성 시작...', percent: 0 });

      const result = await generateCardNews(
        request.topic,
        request.style,
        request.slideCount,
        callbacks,
        abortController,
      );

      if (result.success) {
        const slides = readSlides();
        const imagePaths = getImagePaths();
        sendToRenderer(IPC_CHANNELS.GENERATED, { slides, imagePaths });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sendToRenderer(IPC_CHANNELS.ERROR, { message });
    } finally {
      currentAbortController = null;
    }
  });

  // --- card-news:edit (AI 기반) ---
  ipcMain.handle(IPC_CHANNELS.EDIT, async (_event, request: EditRequest) => {
    const abortController = createAbortController();

    const callbacks = {
      onProgress: (status: string, percent: number) => {
        sendToRenderer(IPC_CHANNELS.PROGRESS, { status, percent });
      },
      onError: (message: string) => {
        sendToRenderer(IPC_CHANNELS.ERROR, { message });
      },
    };

    try {
      const instruction = `${request.slideNumber}번 슬라이드를 수정해줘: ${request.instruction}`;

      const result = await editCardNews(instruction, callbacks, abortController);

      if (result.success) {
        const slides = readSlides();
        const imagePaths = getImagePaths();
        const slideIdx = request.slideNumber - 1;
        const imagePath = imagePaths[slideIdx];
        if (imagePath) {
          sendToRenderer(IPC_CHANNELS.SLIDE_UPDATED, request.slideNumber, imagePath);
        }
        sendToRenderer(IPC_CHANNELS.GENERATED, { slides, imagePaths });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sendToRenderer(IPC_CHANNELS.ERROR, { message });
    } finally {
      currentAbortController = null;
    }
  });

  // --- card-news:direct-edit (AI 미호출, JSON 직접 수정 → 재렌더링) ---
  ipcMain.handle(IPC_CHANNELS.DIRECT_EDIT, async (_event, request: DirectEditRequest) => {
    try {
      const slides = readSlides();
      const slideIdx = request.slideNumber - 1;

      if (slideIdx < 0 || slideIdx >= slides.length) {
        sendToRenderer(IPC_CHANNELS.ERROR, {
          message: `슬라이드 ${request.slideNumber}번이 존재하지 않습니다.`,
        });
        return;
      }

      // JSON 필드 업데이트
      slides[slideIdx] = { ...slides[slideIdx], ...request.changes };
      writeSlides(slides);

      // 재렌더링
      sendToRenderer(IPC_CHANNELS.PROGRESS, { status: '재렌더링 중...', percent: 50 });

      const config = getConfig();
      const currentStyle = config.defaults.template as StyleName;
      const imagePaths = await runRender(currentStyle);

      sendToRenderer(IPC_CHANNELS.GENERATED, { slides, imagePaths });
      sendToRenderer(IPC_CHANNELS.PROGRESS, { status: '완료', percent: 100 });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sendToRenderer(IPC_CHANNELS.ERROR, { message });
    }
  });

  // --- card-news:change-style ---
  ipcMain.handle(IPC_CHANNELS.CHANGE_STYLE, async (_event, newStyle: StyleName) => {
    const abortController = createAbortController();

    const callbacks = {
      onProgress: (status: string, percent: number) => {
        sendToRenderer(IPC_CHANNELS.PROGRESS, { status, percent });
      },
      onError: (message: string) => {
        sendToRenderer(IPC_CHANNELS.ERROR, { message });
      },
    };

    try {
      const result = await changeStyle(newStyle, callbacks, abortController);

      if (result.success) {
        const slides = readSlides();
        const imagePaths = getImagePaths();
        sendToRenderer(IPC_CHANNELS.SLIDES_RERENDERED, imagePaths);
        sendToRenderer(IPC_CHANNELS.GENERATED, { slides, imagePaths });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sendToRenderer(IPC_CHANNELS.ERROR, { message });
    } finally {
      currentAbortController = null;
    }
  });

  // --- card-news:reorder-slides ---
  ipcMain.handle(IPC_CHANNELS.REORDER_SLIDES, async (_event, newOrder: number[]) => {
    try {
      const slides = readSlides();

      // newOrder는 새로운 순서의 slide 번호 배열 (1-based)
      const reordered = newOrder.map((slideNum, idx) => {
        const slide = slides.find((s) => s.slide === slideNum);
        if (!slide) throw new Error(`슬라이드 ${slideNum}번을 찾을 수 없습니다.`);
        return { ...slide, slide: idx + 1 };
      });

      writeSlides(reordered);

      // 재렌더링
      sendToRenderer(IPC_CHANNELS.PROGRESS, { status: '재렌더링 중...', percent: 50 });

      const config = getConfig();
      const currentStyle = config.defaults.template as StyleName;
      const imagePaths = await runRender(currentStyle);

      sendToRenderer(IPC_CHANNELS.SLIDES_RERENDERED, imagePaths);
      sendToRenderer(IPC_CHANNELS.GENERATED, { slides: reordered, imagePaths });
      sendToRenderer(IPC_CHANNELS.PROGRESS, { status: '완료', percent: 100 });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sendToRenderer(IPC_CHANNELS.ERROR, { message });
    }
  });

  // --- card-news:get-styles ---
  ipcMain.handle(IPC_CHANNELS.GET_STYLES, async () => {
    const config = getConfig();
    return config.templates as Record<StyleName, StyleConfig>;
  });

  // --- card-news:export ---
  ipcMain.handle(IPC_CHANNELS.EXPORT, async (_event, _request: ExportRequest) => {
    try {
      // 사용자에게 저장 폴더 선택
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
        title: '카드뉴스 내보내기 폴더 선택',
      });

      if (result.canceled || result.filePaths.length === 0) return;

      const destDir = result.filePaths[0];
      const imagePaths = getImagePaths();

      if (imagePaths.length === 0) {
        sendToRenderer(IPC_CHANNELS.ERROR, {
          message: '내보낼 이미지가 없습니다. 먼저 카드뉴스를 생성해주세요.',
        });
        return;
      }

      const exportedPaths: string[] = [];

      for (const src of imagePaths) {
        const filename = path.basename(src);
        const dest = path.join(destDir, filename);
        fs.copyFileSync(src, dest);
        exportedPaths.push(dest);
      }

      sendToRenderer(IPC_CHANNELS.EXPORTED, exportedPaths);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sendToRenderer(IPC_CHANNELS.ERROR, { message });
    }
  });
}
