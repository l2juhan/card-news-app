import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { IPC_CHANNELS, type UpdateStatusEvent } from '../shared/types';

function broadcast(event: UpdateStatusEvent): void {
  const windows = BrowserWindow.getAllWindows();
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.APP_UPDATE_STATUS, event);
    }
  }
}

let initialized = false;

export function initAutoUpdater(): void {
  if (initialized) return;
  initialized = true;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    broadcast({ kind: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    broadcast({
      kind: 'available',
      info: {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
      },
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    broadcast({
      kind: 'not-available',
      info: info ? { version: info.version, releaseDate: info.releaseDate } : undefined,
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    broadcast({
      kind: 'downloading',
      progress: {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
      },
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    broadcast({
      kind: 'downloaded',
      info: {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
      },
    });
  });

  autoUpdater.on('error', (err) => {
    broadcast({ kind: 'error', message: err?.message ?? String(err) });
  });
}

/** 앱 시작 시 한 번 호출 — 개발 모드에서는 no-op. */
export async function checkForUpdatesOnStartup(): Promise<void> {
  if (!app.isPackaged) return;
  try {
    await autoUpdater.checkForUpdates();
  } catch (err) {
    broadcast({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
  }
}

/** 사용자 요청 — 개발 모드에서도 'not-available'로 명확히 알린다. */
export async function checkForUpdatesManual(): Promise<void> {
  if (!app.isPackaged) {
    broadcast({ kind: 'not-available' });
    return;
  }
  try {
    await autoUpdater.checkForUpdates();
  } catch (err) {
    broadcast({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
  }
}

/** 다운로드된 업데이트를 설치하고 앱 재시작. */
export function installUpdate(): void {
  autoUpdater.quitAndInstall();
}
