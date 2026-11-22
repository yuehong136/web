import type { MemoryDiscoverySelection } from '@/types/memory-incremental'
import { APIError } from '@/api/client'
import type {
  MemoryTargetConfirmation,
  MemoryTargetRecommendations,
} from '@/types/memory-targets'

export function selectedMemoryTargets(
  value: MemoryTargetRecommendations,
  selectedIds: string[],
): MemoryTargetConfirmation {
  const selected = new Set(selectedIds)
  if (
    !selected.size ||
    selected.size !== selectedIds.length ||
    selectedIds.some(
      (id) => !value.targets.some((item) => item.entry_id === id),
    )
  )
    throw new Error('invalid_target_selection')
  const targets = value.confirmation.targets.filter((target) =>
    selected.has(target.entry_id),
  )
  if (targets.length !== selected.size)
    throw new Error('invalid_target_confirmation')
  return structuredClone({ ...value.confirmation, targets })
}
export function targetSourceIds(value: MemoryTargetConfirmation): string[] {
  return [
    ...new Set(
      [
        ...value.inputs,
        ...value.targets.flatMap((target) => target.source_versions),
      ].map((source) => source.source_id),
    ),
  ]
}
export function memoryTargetErrorKey(error: unknown): string {
  if (error instanceof APIError && error.status === 409)
    return 'memory.targets.stale'
  if (error instanceof APIError && error.status === 422)
    return 'memory.targets.invalid'
  return 'memory.targets.unknown'
}

export function memoryTargetSourceRangeKey(
  selection: MemoryDiscoverySelection,
): string {
  return JSON.stringify({
    scope: selection.scope,
    policy: selection.policy,
    batch_size: selection.batch_size,
    max_sources: selection.max_sources,
    input_budget_tokens: selection.input_budget_tokens,
    output_budget_tokens: selection.output_budget_tokens,
    segmentation: selection.segmentation,
  })
}
