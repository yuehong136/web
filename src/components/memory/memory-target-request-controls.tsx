import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MemoryTargetCapabilities } from '@/types/memory-targets'

export interface MemoryTargetRequestDraft {
  sourceText: string
  userId: string
  agentId: string
  query: string
  mode: 'hybrid' | 'lexical'
  limit: number
  budget: number
  queryBudget: number
}
export function MemoryTargetRequestControls({
  value,
  onChange,
  capability,
  sourceIds,
  sourceOptions = [],
  scope,
  disabled,
}: {
  value: MemoryTargetRequestDraft
  onChange: (value: MemoryTargetRequestDraft) => void
  capability: MemoryTargetCapabilities
  sourceIds?: string[]
  sourceOptions?: string[]
  scope?: { user_id: string | null; agent_id: string | null }
  disabled: boolean
}) {
  const { t } = useTranslation()
  const id = useId()
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-space-sm">
      {sourceIds ? (
        <p className="font-mono text-xs break-all">
          {t('memory.dreaming.sourceIds')}:{' '}
          {sourceIds.join(', ') || t('memory.incremental.none')}
        </p>
      ) : (
        <>
          <Label htmlFor={`${id}-sources`}>
            {t('memory.targets.inputSources', {
              count: capability.max_input_sources,
            })}
          </Label>
          <Textarea
            id={`${id}-sources`}
            rows={2}
            value={value.sourceText}
            onChange={(event) =>
              onChange({ ...value, sourceText: event.target.value })
            }
          />
          {!!sourceOptions.length && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={sourceOptions.length > capability.max_input_sources}
              onClick={() =>
                onChange({ ...value, sourceText: sourceOptions.join('\n') })
              }
            >
              {t('memory.targets.usePreviewSources', {
                count: sourceOptions.length,
              })}
            </Button>
          )}
        </>
      )}
      <div className="grid min-w-0 gap-space-base sm:grid-cols-2">
        {(['user', 'agent'] as const).map((kind) => {
          const field = kind === 'user' ? 'userId' : 'agentId'
          const scoped = scope?.[kind === 'user' ? 'user_id' : 'agent_id']
          return (
            <div key={kind} className="min-w-0 space-y-space-xs">
              <Label htmlFor={`${id}-${kind}`}>
                {t(`memory.targets.${kind}`)}
              </Label>
              {scope ? (
                <p
                  id={`${id}-${kind}`}
                  className="text-sm break-all whitespace-pre-wrap"
                >
                  {scoped === null
                    ? t('memory.incremental.allValues')
                    : scoped === ''
                      ? t('memory.incremental.emptyExact')
                      : scoped}
                </p>
              ) : (
                <Input
                  id={`${id}-${kind}`}
                  value={value[field]}
                  onChange={(event) =>
                    onChange({ ...value, [field]: event.target.value })
                  }
                />
              )}
            </div>
          )
        })}
      </div>
      <p className="text-xs text-fg-muted">
        {t('memory.incremental.exactScopeHint')}
      </p>
      {scope && (scope.user_id === null || scope.agent_id === null) && (
        <Alert variant="warning">{t('memory.targets.exactRequired')}</Alert>
      )}
      {scope && (
        <p className="text-xs text-fg-muted">
          {t('memory.targets.sessionBoundary')}
        </p>
      )}
      <Label htmlFor={`${id}-query`}>{t('memory.targets.query')}</Label>
      <Textarea
        id={`${id}-query`}
        rows={2}
        value={value.query}
        onChange={(event) => onChange({ ...value, query: event.target.value })}
      />
      <details className="space-y-space-sm text-xs">
        <summary className="cursor-pointer">
          {t('memory.targets.budget')}
        </summary>
        <div className="grid gap-space-sm sm:grid-cols-2">
          <div className="space-y-space-xs">
            <Label htmlFor={`${id}-mode`}>{t('memory.targets.mode')}</Label>
            <Select
              value={value.mode}
              onValueChange={(mode) =>
                onChange({
                  ...value,
                  mode: mode as MemoryTargetRequestDraft['mode'],
                })
              }
            >
              <SelectTrigger id={`${id}-mode`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {capability.retrieval_modes.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {t(`memory.targets.modes.${mode}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(
            [
              ['limit', 'limit', 1, capability.max_targets],
              ['budget', 'resultBudget', 1024, capability.max_budget_tokens],
              [
                'queryBudget',
                'queryBudget',
                256,
                capability.max_query_budget_tokens,
              ],
            ] as const
          ).map(([field, label, min, max]) => (
            <div key={field} className="space-y-space-xs">
              <Label htmlFor={`${id}-${field}`}>
                {t(`memory.targets.${label}`)}
              </Label>
              <Input
                id={`${id}-${field}`}
                type="number"
                min={min}
                max={max}
                step={1}
                value={Number.isNaN(value[field]) ? '' : value[field]}
                onChange={(event) =>
                  onChange({ ...value, [field]: event.target.valueAsNumber })
                }
              />
            </div>
          ))}
        </div>
      </details>
      <p className="text-xs text-fg-muted">
        {t('memory.targets.modelBoundary')}
      </p>
    </fieldset>
  )
}
