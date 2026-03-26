import { contextBridge, ipcRenderer } from 'electron';
import {
  IPC_CHANNELS,
  type IpcApi,
  type GenerateRequest,
  type EditRequest,
  type DirectEditRequest,
  type ExportRequest,
  type StyleName,
  type ProgressEvent,
  type CardNewsResult,
  type ErrorEvent,
} from '../shared/types';

/** IPC 이벤트 리스너 등록 헬퍼 (해제 함수 반환) */
function onChannel<T>(channel: string, callback: (data: T) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, data: T) => callback(data);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

const api: IpcApi = {
  // -- 요청 (Renderer -> Main) --

  generate(request: GenerateRequest): Promise<void> {
    return ipcRenderer.invoke(IPC_CHANNELS.GENERATE, request);
  },

  edit(request: EditRequest): Promise<void> {
    return ipcRenderer.invoke(IPC_CHANNELS.EDIT, request);
  },

  directEdit(request: DirectEditRequest): Promise<void> {
    return ipcRenderer.invoke(IPC_CHANNELS.DIRECT_EDIT, request);
  },

  changeStyle(newStyle: StyleName): Promise<void> {
    return ipcRenderer.invoke(IPC_CHANNELS.CHANGE_STYLE, newStyle);
  },

  reorderSlides(newOrder: number[]): Promise<void> {
    return ipcRenderer.invoke(IPC_CHANNELS.REORDER_SLIDES, newOrder);
  },

  export(request: ExportRequest): Promise<void> {
    return ipcRenderer.invoke(IPC_CHANNELS.EXPORT, request);
  },

  getStyles() {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_STYLES);
  },

  // -- 이벤트 수신 (Main -> Renderer) --

  onProgress(callback: (event: ProgressEvent) => void): () => void {
    return onChannel(IPC_CHANNELS.PROGRESS, callback);
  },

  onGenerated(callback: (result: CardNewsResult) => void): () => void {
    return onChannel(IPC_CHANNELS.GENERATED, callback);
  },

  onSlideUpdated(callback: (slideNumber: number, imagePath: string) => void): () => void {
    const handler = (_event: Electron.IpcRendererEvent, slideNumber: number, imagePath: string) =>
      callback(slideNumber, imagePath);
    ipcRenderer.on(IPC_CHANNELS.SLIDE_UPDATED, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.SLIDE_UPDATED, handler);
  },

  onSlidesRerendered(callback: (imagePaths: string[]) => void): () => void {
    return onChannel(IPC_CHANNELS.SLIDES_RERENDERED, callback);
  },

  onExported(callback: (paths: string[]) => void): () => void {
    return onChannel(IPC_CHANNELS.EXPORTED, callback);
  },

  onError(callback: (error: ErrorEvent) => void): () => void {
    return onChannel(IPC_CHANNELS.ERROR, callback);
  },
};

contextBridge.exposeInMainWorld('api', api);
