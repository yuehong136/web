import { isTrustedAppUrl } from '../app-protocol/app-url'

const DESKTOP_RUNTIME_MARKER = 'desktop'
const DESKTOP_RUNTIME_MARKER_PROBE =
  'document.documentElement.dataset.clientRuntime ?? null'
const DESKTOP_RUNTIME_MARKER_POLL_MS = 25

export const DESKTOP_COMPOSITION_TIMEOUT_MS = 5_000

interface DesktopCompositionWebContents {
  executeJavaScript(script: string, userGesture?: boolean): Promise<unknown>
  getURL(): string
}

export function isExpectedRendererDocument(url: string): boolean {
  return isTrustedAppUrl(url)
}

function executeMarkerProbe(
  webContents: DesktopCompositionWebContents,
  timeoutMs: number,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Desktop composition marker verification timed out.'))
    }, timeoutMs)

    void webContents
      .executeJavaScript(DESKTOP_RUNTIME_MARKER_PROBE, false)
      .then(resolve, () => {
        reject(new Error('Desktop composition marker verification failed.'))
      })
      .finally(() => clearTimeout(timeout))
  })
}

function waitForNextMarkerProbe(remainingMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(
      resolve,
      Math.min(DESKTOP_RUNTIME_MARKER_POLL_MS, Math.max(0, remainingMs)),
    )
  })
}

/**
 * Verifies the fixed, read-only Renderer marker used by packaged startup smoke.
 * The probe is intentionally not caller-provided and both URL checks validate
 * the trusted packaged origin so a navigation race cannot pass readiness.
 */
export async function assertDesktopCompositionReady(
  webContents: DesktopCompositionWebContents,
  timeoutMs = DESKTOP_COMPOSITION_TIMEOUT_MS,
): Promise<void> {
  if (!isExpectedRendererDocument(webContents.getURL())) {
    throw new Error('Desktop composition document is not trusted.')
  }

  const deadline = Date.now() + Math.max(1, timeoutMs)
  while (true) {
    if (!isExpectedRendererDocument(webContents.getURL())) {
      throw new Error(
        'Desktop composition document changed during verification.',
      )
    }

    const remainingMs = Math.max(1, deadline - Date.now())
    const marker = await executeMarkerProbe(webContents, remainingMs)

    if (!isExpectedRendererDocument(webContents.getURL())) {
      throw new Error(
        'Desktop composition document changed during verification.',
      )
    }
    if (marker === DESKTOP_RUNTIME_MARKER) return
    if (Date.now() >= deadline) {
      throw new Error('Desktop composition marker is missing or invalid.')
    }

    await waitForNextMarkerProbe(deadline - Date.now())
  }
}
