import { resolveArtifactUrl } from '@/lib/agent/artifact-url'
import {
  assertNonEmptyBlob,
  assertPreviewResponse,
  createPreviewObjectUrl,
  fetchPreviewResource,
  revokePreviewObjectUrl,
} from '@/lib/knowledge/preview-resource'

export { isArtifactUrl, resolveArtifactUrl } from '@/lib/agent/artifact-url'

const OBJECT_URL_REVOKE_DELAY_MS = 60 * 1000

const decodeFilename = (filename: string): string => {
  try {
    return decodeURIComponent(filename)
  } catch {
    return filename
  }
}

export const getArtifactName = (url?: string, fallback?: string): string => {
  const trimmedFallback = fallback?.trim()
  if (trimmedFallback) return trimmedFallback

  if (!url) return 'artifact'

  try {
    const parsed = new URL(resolveArtifactUrl(url))
    const filename = parsed.pathname.split('/').filter(Boolean).pop()
    return filename ? decodeFilename(filename) : 'artifact'
  } catch {
    const filename = url.split('?')[0]?.split('#')[0]?.split('/').pop()
    return filename ? decodeFilename(filename) : 'artifact'
  }
}

export const fetchArtifactBlob = async (
  url: string,
  signal?: AbortSignal,
): Promise<Blob> => {
  const resolvedUrl = resolveArtifactUrl(url)
  const response = await fetchPreviewResource(resolvedUrl, signal, 'error')
  const contentType = response.headers.get('content-type') || ''
  const disposition = response.headers.get('content-disposition') || ''
  const dispositionFilename =
    /^(?:inline|attachment);\s*filename="([^"]+)"(?:;|$)/i.exec(
      disposition,
    )?.[1]
  const requestedFilename = new URL(resolvedUrl).pathname.split('/').pop()
  const isArtifactDocument =
    response.ok &&
    (contentType.includes('application/json') ||
      contentType.includes('text/html')) &&
    dispositionFilename === requestedFilename
  if (!isArtifactDocument) await assertPreviewResponse(response)
  const blob = await response.blob()
  assertNonEmptyBlob(blob)
  return blob
}

export const downloadArtifactBlob = (blob: Blob, filename: string): void => {
  const objectUrl = createPreviewObjectUrl(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  revokePreviewObjectUrl(objectUrl)
}

export const shouldForceArtifactDownload = (
  blob: Blob,
  filename: string,
): boolean =>
  /^(?:text\/(?:html|csv)|image\/svg\+xml)(?:;|$)/i.test(blob.type) ||
  /\.(?:html|svg|csv)$/i.test(filename)

const scheduleObjectUrlRevoke = (objectUrl: string): void => {
  window.setTimeout(() => {
    revokePreviewObjectUrl(objectUrl)
  }, OBJECT_URL_REVOKE_DELAY_MS)
}

export const openArtifactResource = async (href: string): Promise<void> => {
  resolveArtifactUrl(href)
  // Acquire the window during the click, before the authenticated fetch. A
  // noopener window.open returns null even when it opens successfully.
  const previewWindow = window.open('about:blank', '_blank')
  try {
    if (previewWindow) previewWindow.opener = null
    const blob = await fetchArtifactBlob(href)
    const filename = getArtifactName(href)
    if (
      shouldForceArtifactDownload(blob, filename) ||
      !previewWindow ||
      previewWindow.closed
    ) {
      previewWindow?.close()
      downloadArtifactBlob(blob, filename)
      return
    }

    const objectUrl = createPreviewObjectUrl(blob)
    try {
      previewWindow.location.replace(objectUrl)
    } catch (error) {
      revokePreviewObjectUrl(objectUrl)
      throw error
    }
    scheduleObjectUrlRevoke(objectUrl)
  } catch (error) {
    previewWindow?.close()
    throw error
  }
}
