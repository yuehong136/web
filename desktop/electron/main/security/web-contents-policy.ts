import type { WebContents } from 'electron'
import { shouldBlockMainFrameNavigation } from './navigation-policy'

export function installWebContentsSecurityPolicy(
  webContents: WebContents,
): void {
  webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  webContents.on('will-navigate', (event) => {
    if (shouldBlockMainFrameNavigation(event.url, event.isMainFrame)) {
      event.preventDefault()
    }
  })

  webContents.on('will-frame-navigate', (event) => {
    if (shouldBlockMainFrameNavigation(event.url, event.isMainFrame)) {
      event.preventDefault()
    }
  })

  webContents.on('will-attach-webview', (event) => {
    event.preventDefault()
  })

  webContents.on('content-bounds-updated', (event) => {
    event.preventDefault()
  })
}
