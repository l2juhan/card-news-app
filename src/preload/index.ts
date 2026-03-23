import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // Phase 3에서 IPC 핸들러 확장 예정
  // 예시:
  // generate: (topic: string, style: string, slideCount: number) =>
  //   ipcRenderer.invoke('card-news:generate', topic, style, slideCount),

  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  invoke: (channel: string, ...args: unknown[]) => {
    return ipcRenderer.invoke(channel, ...args);
  },
};

contextBridge.exposeInMainWorld('api', api);

export type ElectronApi = typeof api;
