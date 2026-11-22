import type { QueryClient } from '@tanstack/react-query'
import type { MemoryCompactionResult } from '@/types/memory-compaction'
import { compactionReaderSource } from '@/lib/memory-compaction'
import { sourceProvenanceChanged } from './memory-source-provenance-fence'

/** Known local changes only invalidate a view; the server freshly rechecks ACL and physical bindings on GET. */
export function protectMemoryCompaction(
  cache: QueryClient,
  id: string,
  value: MemoryCompactionResult,
): MemoryCompactionResult {
  const artifact = value.artifact
  if (!artifact?.package) return value
  if (
    artifact.valid_for_current !== true ||
    artifact.redacted ||
    artifact.sources.some((source) =>
      sourceProvenanceChanged(
        cache,
        id,
        source.source_id,
        compactionReaderSource(source),
      ),
    )
  )
    return {
      ...value,
      artifact: {
        ...artifact,
        state: 'stale',
        valid_for_current: false,
        package: null,
      },
    }
  return value
}
