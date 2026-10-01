import { APIError } from '@/api/client'
import { te } from '@/api/client-types'

export enum AttachmentPreviewMode {
  DataURL = 'data-url',
  ObjectURL = 'object-url',
}

/** Read chat image previews durably so clearing the composer keeps message images. */
export function readAttachmentPreview(
  file: File,
  signal: AbortSignal,
): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const cancelled = () => new APIError(0, 'CANCELLED', te('unknown'))
    if (signal.aborted) {
      reject(cancelled())
      return
    }
    const reader = new FileReader()
    const cleanup = () => {
      reader.onload = reader.onerror = reader.onabort = null
      signal.removeEventListener('abort', abort)
    }
    const abort = () => {
      cleanup()
      reader.abort()
      reject(cancelled())
    }
    reader.onload = () => {
      cleanup()
      resolve(typeof reader.result === 'string' ? reader.result : undefined)
    }
    reader.onerror = () => {
      cleanup()
      resolve(undefined)
    }
    reader.onabort = () => {
      cleanup()
      reject(cancelled())
    }
    signal.addEventListener('abort', abort, { once: true })
    try {
      reader.readAsDataURL(file)
    } catch {
      cleanup()
      resolve(undefined)
    }
  })
}
