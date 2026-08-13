import { BrowserWindow, app } from 'electron'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { APP_ENTRY_URL } from '../app-protocol/constants'
import { installWebContentsSecurityPolicy } from '../security/web-contents-policy'
import {
  assertDesktopCompositionReady,
  isExpectedRendererDocument,
} from './readiness-policy'
import { createMainWindowWebPreferences } from './window-options'

const DOM_READY_TIMEOUT_MS = 15_000

export enum MainWindowReadiness {
  LOAD = 'load',
  DESKTOP_COMPOSITION = 'desktop_composition',
}

export interface MainWindowOptions {
  readonly showWhenReady?: boolean
  readonly readiness?: MainWindowReadiness
}

function resolvePreloadPath(): string {
  const mainBundleDirectory = fileURLToPath(new URL('.', import.meta.url))
  return resolve(mainBundleDirectory, '..', 'preload', 'index.cjs')
}

function waitForDomReady(window: BrowserWindow): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Desktop Renderer did not become ready in time.'))
    }, DOM_READY_TIMEOUT_MS)

    const cleanup = (): void => {
      clearTimeout(timeout)
      window.webContents.removeListener('dom-ready', onDomReady)
      window.webContents.removeListener('did-fail-load', onDidFailLoad)
      window.webContents.removeListener('destroyed', onDestroyed)
    }
    const onDomReady = (): void => {
      if (!isExpectedRendererDocument(window.webContents.getURL())) return
      cleanup()
      resolve()
    }
    const onDidFailLoad = (
      _event: Electron.Event,
      errorCode: number,
      errorDescription: string,
      validatedURL: string,
      isMainFrame: boolean,
    ): void => {
      if (!isMainFrame) return
      cleanup()
      reject(
        new Error(
          `Desktop Renderer failed to load (${errorCode} ${errorDescription}): ${validatedURL}`,
        ),
      )
    }
    const onDestroyed = (): void => {
      cleanup()
      reject(new Error('Desktop Renderer was destroyed before becoming ready.'))
    }

    window.webContents.on('dom-ready', onDomReady)
    window.webContents.on('did-fail-load', onDidFailLoad)
    window.webContents.once('destroyed', onDestroyed)
  })
}

export async function createMainWindow(
  options: MainWindowOptions = {},
): Promise<BrowserWindow> {
  const showWhenReady = options.showWhenReady ?? true
  const readiness = options.readiness ?? MainWindowReadiness.LOAD
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    title: 'MultiRAG',
    backgroundColor: '#0f172a',
    webPreferences: createMainWindowWebPreferences(
      resolvePreloadPath(),
      app.isPackaged,
    ),
  })

  installWebContentsSecurityPolicy(window.webContents)
  let preloadFailure: Error | null = null
  window.webContents.once('preload-error', (_event, _preloadPath, error) => {
    preloadFailure = error
  })
  if (showWhenReady) window.once('ready-to-show', () => window.show())
  const desktopCompositionReady =
    readiness === MainWindowReadiness.DESKTOP_COMPOSITION
      ? waitForDomReady(window)
      : null
  const load = window.loadURL(APP_ENTRY_URL)
  if (desktopCompositionReady) {
    void load.catch(() => undefined)
    await desktopCompositionReady
    await assertDesktopCompositionReady(window.webContents)
  } else {
    await load
  }
  if (preloadFailure) throw preloadFailure
  return window
}
