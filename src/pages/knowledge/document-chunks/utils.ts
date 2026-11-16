export const formatChunkFileSize = (size: number) => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

// The chunk list's document carries the canonical run state ("DONE"); the
// status components read the legacy codes ("3").
const LEGACY_RUN: Record<string, string> = {
  UNSTART: '0',
  RUNNING: '1',
  CANCEL: '2',
  DONE: '3',
  FAIL: '4',
}

export const legacyRunStatus = (run?: string | null) =>
  (run && LEGACY_RUN[run]) ?? run ?? '0'
