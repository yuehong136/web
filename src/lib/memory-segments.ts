import type { MemorySourceSegmentation } from '@/types/memory-segments'

export interface MemorySegmentControlLimits {
  minTokens: number
  maxTokens: number
  maxParts: number
}

export function validMemorySegmentation(
  value: MemorySourceSegmentation | undefined,
  limits: MemorySegmentControlLimits,
): boolean {
  return (
    !value ||
    value.mode === 'whole' ||
    (Number.isInteger(value.fragment_token_limit) &&
      value.fragment_token_limit >= limits.minTokens &&
      value.fragment_token_limit <= limits.maxTokens &&
      Number.isInteger(value.max_parts_per_source) &&
      value.max_parts_per_source >= 1 &&
      value.max_parts_per_source <= limits.maxParts)
  )
}

const reasons = new Set([
  'segment_parts_limit',
  'segment_plan_limit',
  'segment_source_size_limit',
  'segment_context_budget',
  'segment_no_fragment_fits',
  'input_budget',
])

export function memorySegmentReasonKey(
  code: string | null | undefined,
): string {
  return `memory.segments.reasons.${code && reasons.has(code) ? code : 'unknown'}`
}
