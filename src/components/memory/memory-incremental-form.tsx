import { MemoryTargetRecommendations } from './memory-target-recommendations'
import { emptyMemoryTargetSelection } from '@/hooks/use-memory-target-selection'
import { memoryTargetSourceRangeKey } from '@/lib/memory-targets'
import type { MemoryTargetCapabilities } from '@/types/memory-targets'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SectionCard } from '@/components/patterns/section-card'
import { MemorySegmentationControl } from './memory-segmentation-control'
import { validMemorySegmentation } from '@/lib/memory-segments'
import type { MemorySourceSegmentation } from '@/types/memory-segments'
import type { MemoryDiscoverySelection } from '@/types/memory-incremental'
import type { MemoryCapabilities } from '@/types/memory-revisions'
import {
  initialMemoryScopeDraft,
  MemoryIncrementalScope,
} from './memory-incremental-scope'

const splitIds = (value: string) =>
  value.trim() ? value.trim().split(/[\s,]+/) : []

export function MemoryIncrementalForm({
  memoryId = '',
  targetCapability,
  sourceOptions,
  targetConflictEpoch = 0,
  capabilities,
  pending,
  locked,
  onDirty,
  onPreview,
  initialSelection,
}: {
  memoryId?: string
  targetCapability?: MemoryTargetCapabilities
  sourceOptions?: { ids: string[]; selection: MemoryDiscoverySelection }
  targetConflictEpoch?: number
  capabilities: NonNullable<
    NonNullable<MemoryCapabilities['maintenance']>['discoveries']
  >
  pending: boolean
  locked: boolean
  onDirty: () => void
  onPreview: (selection: MemoryDiscoverySelection) => void
  initialSelection?: MemoryDiscoverySelection
}) {
  const { t } = useTranslation()
  const [targetSelection, setTargetSelection] = useState(
    emptyMemoryTargetSelection,
  )
  const [segmentation, setSegmentation] = useState<
    MemorySourceSegmentation | undefined
  >(initialSelection?.segmentation)
  const segmentCapability = capabilities.segmentation
  const segmentLimits = {
    minTokens: segmentCapability?.fragment_token_limit?.min ?? 256,
    maxTokens: segmentCapability?.fragment_token_limit?.max ?? 8192,
    maxParts: segmentCapability?.max_parts_per_source?.max ?? 64,
  }
  const segmentationValid =
    validMemorySegmentation(segmentation, segmentLimits) &&
    (segmentation?.mode !== 'segmented' ||
      segmentCapability?.supported === true)
  const [scope, setScope] = useState(() =>
    initialSelection
      ? {
          user: {
            match:
              initialSelection.scope.user_id === null
                ? ('all' as const)
                : ('exact' as const),
            text: initialSelection.scope.user_id ?? '',
          },
          agent: {
            match:
              initialSelection.scope.agent_id === null
                ? ('all' as const)
                : ('exact' as const),
            text: initialSelection.scope.agent_id ?? '',
          },
          session: {
            match:
              initialSelection.scope.session_id === null
                ? ('all' as const)
                : ('exact' as const),
            text: initialSelection.scope.session_id ?? '',
          },
        }
      : initialMemoryScopeDraft(),
  )
  const schema = z.object({
    policy: z.enum(['general', 'preferences', 'decisions', 'procedures']),
    entries: z.string().refine((text) => {
      if (targetSelection.active) return true
      const values = splitIds(text)
      return (
        values.length <= 32 &&
        new Set(values).size === values.length &&
        values.every((value) => /^[0-9a-f]{32}$/.test(value))
      )
    }, t('memory.dreaming.invalidEntries')),
    batchSize: z
      .number()
      .int()
      .min(1)
      .max(Math.min(32, capabilities.max_batch_sources)),
    maxSources: z
      .number()
      .int()
      .min(1)
      .max(Math.min(256, capabilities.max_sources)),
    inputBudget: z.number().int().min(1024).max(32768),
    outputBudget: z.number().int().min(256).max(8192),
  })
  type Values = z.infer<typeof schema>
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      policy: initialSelection?.policy ?? 'general',
      entries: initialSelection?.entry_ids.join('\n') ?? '',
      batchSize:
        initialSelection?.batch_size ??
        Math.min(32, capabilities.max_batch_sources),
      maxSources:
        initialSelection?.max_sources ??
        Math.min(128, capabilities.max_sources),
      inputBudget: initialSelection?.input_budget_tokens ?? 16384,
      outputBudget: initialSelection?.output_budget_tokens ?? 4096,
    },
  })
  const policy = form.watch('policy')
  const currentSelection: MemoryDiscoverySelection = {
    scope: {
      user_id: scope.user.match === 'exact' ? scope.user.text : null,
      agent_id: scope.agent.match === 'exact' ? scope.agent.text : null,
      session_id: scope.session.match === 'exact' ? scope.session.text : null,
    },
    policy,
    entry_ids: [],
    batch_size: form.watch('batchSize'),
    max_sources: form.watch('maxSources'),
    input_budget_tokens: form.watch('inputBudget'),
    output_budget_tokens: form.watch('outputBudget'),
    ...(segmentation?.mode === 'segmented' ? { segmentation } : {}),
  }
  const sourceKey = memoryTargetSourceRangeKey(currentSelection)
  const matchingOptions =
    sourceOptions &&
    memoryTargetSourceRangeKey(sourceOptions.selection) === sourceKey
      ? sourceOptions.ids
      : []
  return (
    <SectionCard title={t('memory.incremental.selection')}>
      <form
        className="space-y-space-lg"
        onChange={onDirty}
        onSubmit={form.handleSubmit(
          (values) =>
            segmentationValid &&
            !targetSelection.blocked &&
            onPreview({
              ...(segmentation?.mode === 'segmented' ? { segmentation } : {}),
              scope: {
                user_id: scope.user.match === 'exact' ? scope.user.text : null,
                agent_id:
                  scope.agent.match === 'exact' ? scope.agent.text : null,
                session_id:
                  scope.session.match === 'exact' ? scope.session.text : null,
              },
              policy: values.policy,
              entry_ids: targetSelection.active
                ? targetSelection.entryIds
                : splitIds(values.entries),
              ...(targetSelection.confirmation
                ? { target_preconditions: targetSelection.confirmation }
                : {}),
              batch_size: values.batchSize,
              max_sources: values.maxSources,
              input_budget_tokens: values.inputBudget,
              output_budget_tokens: values.outputBudget,
            }),
        )}
      >
        <MemoryIncrementalScope
          value={scope}
          disabled={locked}
          onChange={(next) => {
            onDirty()
            setScope(next)
          }}
        />
        <MemorySegmentationControl
          value={segmentation}
          supported={segmentCapability?.supported === true}
          limits={segmentLimits}
          disabled={locked}
          onChange={(value) => {
            onDirty()
            setSegmentation(value)
          }}
        />
        <fieldset disabled={locked} className="space-y-space-base">
          <MemoryTargetRecommendations
            memoryId={memoryId}
            capability={targetCapability}
            initialConfirmation={initialSelection?.target_preconditions}
            sourceOptions={matchingOptions}
            scope={{
              user_id: currentSelection.scope.user_id,
              agent_id: currentSelection.scope.agent_id,
            }}
            inputKey={JSON.stringify([sourceKey, targetConflictEpoch])}
            disabled={locked || pending}
            onDirty={onDirty}
            onSelection={setTargetSelection}
          />
          {!targetSelection.active && (
            <>
              <div className="space-y-space-sm">
                <Label htmlFor="incremental-entry-ids">
                  {t('memory.incremental.contextEntries')}
                </Label>
                <Textarea
                  id="incremental-entry-ids"
                  rows={2}
                  {...form.register('entries')}
                />
                <p className="text-xs text-text-secondary">
                  {t('memory.incremental.contextHint')}
                </p>
                {form.formState.errors.entries && (
                  <p role="alert" className="text-sm text-status-error">
                    {t('memory.dreaming.invalidEntries')}
                  </p>
                )}
              </div>
            </>
          )}
          <div className="grid gap-space-base md:grid-cols-3">
            <div className="space-y-space-sm">
              <Label htmlFor="incremental-policy">
                {t('memory.dreaming.policy')}
              </Label>
              <Select
                value={policy}
                onValueChange={(value) => {
                  onDirty()
                  form.setValue('policy', value as Values['policy'], {
                    shouldValidate: true,
                  })
                }}
              >
                <SelectTrigger id="incremental-policy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      'general',
                      'preferences',
                      'decisions',
                      'procedures',
                    ] as const
                  ).map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`memory.dreaming.policies.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(
              [
                [
                  'batchSize',
                  'batchSize',
                  1,
                  Math.min(32, capabilities.max_batch_sources),
                ],
                [
                  'maxSources',
                  'maxSources',
                  1,
                  Math.min(256, capabilities.max_sources),
                ],
                ['inputBudget', 'inputBudget', 1024, 32768],
                ['outputBudget', 'outputBudget', 256, 8192],
              ] as const
            ).map(([field, label, min, max]) => (
              <div key={field} className="space-y-space-sm">
                <Label htmlFor={`incremental-${field}`}>
                  {t(`memory.incremental.${label}`)}
                </Label>
                <Input
                  id={`incremental-${field}`}
                  type="number"
                  min={min}
                  max={max}
                  step={1}
                  {...form.register(field, { valueAsNumber: true })}
                />
                {form.formState.errors[field] && (
                  <p role="alert" className="text-sm text-status-error">
                    {t('memory.incremental.invalidNumber', { min, max })}
                  </p>
                )}
              </div>
            ))}
          </div>
          <Button
            type="submit"
            disabled={pending || !segmentationValid || targetSelection.blocked}
          >
            {t('memory.incremental.preview')}
          </Button>
        </fieldset>
      </form>
    </SectionCard>
  )
}
