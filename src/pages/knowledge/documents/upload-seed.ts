import type { UploadFile } from '@/components/ui/file-uploader'

export const DOCUMENT_UPLOAD_MAX_SIZE = 1024 * 1024 * 1024
export const DOCUMENT_UPLOAD_MAX_FILE_COUNT = 32

let seeded = 0

/**
 * Files dropped on the documents page, checked against the upload dialog's
 * limits (size, count, duplicates) and shaped like the dialog's own picks.
 */
export function seedUploadFiles(files: readonly File[]) {
  const seen = new Set<string>()
  const tooLarge: File[] = []
  const accepted: UploadFile[] = []
  let overflow = 0
  for (const file of files) {
    const key = `${file.name}-${file.size}`
    if (seen.has(key)) continue
    seen.add(key)
    if (file.size > DOCUMENT_UPLOAD_MAX_SIZE) {
      tooLarge.push(file)
      continue
    }
    if (accepted.length >= DOCUMENT_UPLOAD_MAX_FILE_COUNT) {
      overflow += 1
      continue
    }
    seeded += 1
    accepted.push(
      Object.assign(file, {
        status: 'pending' as const,
        progress: 0,
        uid: `dropped-${Date.now()}-${seeded}`,
      }),
    )
  }
  return { accepted, tooLarge, overflow }
}
