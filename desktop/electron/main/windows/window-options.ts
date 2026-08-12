import type { WebPreferences } from 'electron'

export function createMainWindowWebPreferences(
  preloadPath: string,
  isPackaged: boolean,
): Readonly<WebPreferences> {
  return Object.freeze({
    preload: preloadPath,
    sandbox: true,
    contextIsolation: true,
    nodeIntegration: false,
    nodeIntegrationInWorker: false,
    nodeIntegrationInSubFrames: false,
    webviewTag: false,
    webSecurity: true,
    allowRunningInsecureContent: false,
    experimentalFeatures: false,
    navigateOnDragDrop: false,
    safeDialogs: true,
    devTools: !isPackaged,
  })
}
