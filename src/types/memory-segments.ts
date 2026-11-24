/** Explicit source splitting uses original decoded Unicode codepoint offsets. */
export interface MemorySourceFragment {
  fragment_id: string
  part_index: number
  part_count: number
  offset_unit: 'unicode_codepoint'
  core_start: number
  core_end: number
  read_start: number
  read_end: number
  core_sha256: string
  read_sha256: string
  splitter_version: string
}

export interface MemorySegmentedSelection {
  mode: 'segmented'
  fragment_token_limit: number
  max_parts_per_source: number
}

export type MemorySourceSegmentation =
  { mode: 'whole' } | MemorySegmentedSelection

export interface MemorySegmentationProfile extends MemorySegmentedSelection {
  context_codepoints?: number
  splitter_version: string
}

export interface MemorySegmentationCapabilities {
  supported: boolean
  default_mode: 'whole'
  splitter_version: string
  fragment_token_limit: { min: number; max: number; default: number }
  max_parts_per_source: { min: number; max: number; default: number }
  max_total_fragments: number
  context_codepoints: number
  offset_unit: 'unicode_codepoint'
}

export interface MemorySourceCoverage {
  unit: 'sources'
  selected: number
  covered: number
  partial: number
  blocked: number
  total_parts: number
  analyzed_parts: number
}
