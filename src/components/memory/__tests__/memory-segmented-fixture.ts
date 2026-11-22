import type { IncrementalHarness } from './memory-incremental-fixture'
import { caps, source } from './memory-incremental-fixture'
import type {
  MemorySourceFragment,
  MemorySegmentationCapabilities,
} from '@/types/memory-segments'

export const segmentCapability: MemorySegmentationCapabilities = {
  supported: true,
  default_mode: 'whole',
  splitter_version: 'unicode-boundary-v1',
  fragment_token_limit: { min: 256, max: 8192, default: 2048 },
  max_parts_per_source: { min: 1, max: 64, default: 32 },
  max_total_fragments: 256,
  context_codepoints: 64,
  offset_unit: 'unicode_codepoint',
}
export const segmentedCaps = () => {
  const value = structuredClone(caps)
  value.maintenance!.discoveries!.segmentation =
    structuredClone(segmentCapability)
  return value
}
export const part = (index: number): MemorySourceFragment => ({
  fragment_id: String(index + 1).repeat(64),
  part_index: index,
  part_count: 3,
  offset_unit: 'unicode_codepoint',
  core_start: index * 100,
  core_end: (index + 1) * 100,
  read_start: Math.max(0, index * 100 - 64),
  read_end: Math.min(300, (index + 1) * 100 + 64),
  core_sha256: 'c'.repeat(64),
  read_sha256: 'd'.repeat(64),
  splitter_version: 'unicode-boundary-v1',
})
export function prepareSegmented(h: IncrementalHarness): void {
  h.preview = {
    ...h.preview,
    token_fit: 'checked_at_preview',
    profile: {
      ...h.preview.profile,
      segmentation: {
        mode: 'segmented',
        fragment_token_limit: 256,
        max_parts_per_source: 32,
        splitter_version: 'unicode-boundary-v1',
      },
    },
    counts: {
      active: 1,
      covered: 0,
      inflight: 0,
      blocked: 0,
      eligible: 1,
      selected_primary: 1,
      context: 0,
      selected_fragments: 3,
    },
    source_coverage: {
      unit: 'sources',
      selected: 1,
      covered: 0,
      partial: 0,
      blocked: 0,
      total_parts: 3,
      analyzed_parts: 0,
    },
    blocked_sources: [],
    batches: [0, 1, 2].map((index) => ({
      ordinal: index + 1,
      primary_sources: [{ ...source(), fragment: part(index) }],
      context_sources: [],
      entry_ids: [],
    })),
  }
  h.discovery = {
    ...h.discovery,
    ...h.preview,
    batches: h.preview.batches.map((batch, index) => ({
      ...h.discovery.batches[0],
      ...batch,
      batch_id: String(index + 1).repeat(32),
      job_id: String(index + 4).repeat(32),
      create_operation_id: `create-part-${index}`,
      analysis_operation_id: `analyze-part-${index}`,
    })),
    progress: { ...h.discovery.progress, planned: 3, pending: 3 },
  }
}
