import { useLayoutEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { parseMemorySourceIds } from '@/lib/memory-source-ids'
import {
  useMemoryTargetSelection,
  type MemoryTargetSelectionState,
} from '@/hooks/use-memory-target-selection'
import type {
  MemoryTargetCapabilities,
  MemoryTargetRecommendationRequest,
} from '@/types/memory-targets'
import { MemoryTargetPicker } from './memory-target-picker'
import {
  MemoryTargetBudget,
  useMemoryTargetCards,
} from './memory-target-results'
import {
  MemoryTargetRequestControls,
  type MemoryTargetRequestDraft,
} from './memory-target-request-controls'

export function MemoryTargetRecommendations({
  memoryId,
  capability,
  initialConfirmation,
  sourceIds,
  sourceOptions,
  scope,
  inputKey,
  disabled,
  onDirty,
  onSelection,
}: {
  memoryId: string
  capability?: MemoryTargetCapabilities
  initialConfirmation?: import('@/types/memory-targets').MemoryTargetConfirmation
  sourceIds?: string[]
  sourceOptions?: string[]
  scope?: { user_id: string | null; agent_id: string | null }
  inputKey: string
  disabled: boolean
  onDirty: () => void
  onSelection: (value: MemoryTargetSelectionState) => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<MemoryTargetRequestDraft>({
    sourceText:
      initialConfirmation?.inputs
        .map((source) => source.source_id)
        .join('\n') ?? '',
    userId: '',
    agentId: '',
    query: '',
    mode: 'hybrid',
    limit: Math.min(5, capability?.max_targets ?? 8),
    budget: Math.min(4096, capability?.max_budget_tokens ?? 8192),
    queryBudget: Math.min(2048, capability?.max_query_budget_tokens ?? 4096),
  })
  const key = JSON.stringify([
    inputKey,
    sourceIds,
    scope,
    draft,
    capability?.supported,
  ])
  const selection = useMemoryTargetSelection(
    memoryId,
    key,
    onDirty,
    initialConfirmation,
  )
  const cards = useMemoryTargetCards(selection.snapshot)
  const boundSelection = useMemo(
    () => ({
      ...selection.selection,
      blocked:
        selection.selection.blocked ||
        (selection.selection.active && !capability?.supported),
    }),
    [selection.selection, capability?.supported],
  )
  useLayoutEffect(
    () => onSelection(boundSelection),
    [onSelection, boundSelection],
  )
  let request: MemoryTargetRecommendationRequest | undefined
  try {
    if (
      capability?.supported &&
      (!scope || (scope.user_id !== null && scope.agent_id !== null))
    ) {
      const ids = parseMemorySourceIds(
        sourceIds ? sourceIds.join('\n') : draft.sourceText,
        Math.min(8, capability.max_input_sources),
      )
      if (
        Number.isInteger(draft.limit) &&
        draft.limit >= 1 &&
        draft.limit <= capability.max_targets &&
        Number.isInteger(draft.budget) &&
        draft.budget >= 1024 &&
        draft.budget <= capability.max_budget_tokens &&
        Number.isInteger(draft.queryBudget) &&
        draft.queryBudget >= 256 &&
        draft.queryBudget <= capability.max_query_budget_tokens &&
        [...draft.query].length <= 4096 &&
        capability.retrieval_modes.includes(draft.mode)
      ) {
        request = {
          source_ids: ids,
          user_id: scope?.user_id ?? draft.userId,
          agent_id: scope?.agent_id ?? draft.agentId,
          query: draft.query === '' ? null : draft.query,
          retrieval_mode: draft.mode,
          limit: draft.limit,
          budget_tokens: draft.budget,
          query_budget_tokens: draft.queryBudget,
        }
      }
    }
  } catch {
    /* Invalid source drafts never trigger a request. */
  }
  if (!capability?.supported)
    return selection.selection.active ? (
      <div className="space-y-space-sm">
        <Alert variant="warning">{t('memory.targets.unsupported')}</Alert>
        <Button type="button" variant="outline" onClick={selection.clear}>
          {t('memory.targets.clear')}
        </Button>
      </div>
    ) : null
  return (
    <MemoryTargetPicker
      controls={
        <>
          {!selection.snapshot && selection.selection.confirmation && (
            <div className="space-y-space-xs text-xs">
              <p>{t('memory.targets.restored')}</p>
              {selection.selection.confirmation.targets.map((target) => (
                <p key={target.entry_id} className="font-mono break-all">
                  {target.entry_id} [{target.revision}] ·{' '}
                  {target.content_sha256}
                </p>
              ))}
            </div>
          )}
          <MemoryTargetRequestControls
            value={draft}
            onChange={setDraft}
            capability={capability}
            sourceIds={sourceIds}
            sourceOptions={sourceOptions}
            scope={scope}
            disabled={disabled || selection.pending}
          />
          {!request && (
            <p className="text-xs text-warning-fg">
              {t('memory.targets.invalid')}
            </p>
          )}
        </>
      }
      items={cards}
      selectedIds={selection.selectedIds}
      pending={selection.pending}
      locked={disabled}
      requestDisabled={!request}
      active={selection.selection.active}
      stale={selection.stale}
      requested={!!selection.snapshot}
      budget={
        selection.snapshot && <MemoryTargetBudget value={selection.snapshot} />
      }
      errorKey={selection.errorKey}
      onRequest={() => {
        if (request) void selection.request(request)
      }}
      onToggle={selection.toggle}
      onApply={selection.apply}
      onClear={selection.clear}
    />
  )
}
