import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type MemoryScopeDimension = 'user' | 'agent' | 'session'
export interface MemoryScopeChoice {
  match: 'all' | 'exact'
  text: string
}
export type MemoryScopeDraft = Record<MemoryScopeDimension, MemoryScopeChoice>

export function initialMemoryScopeDraft(): MemoryScopeDraft {
  return {
    user: { match: 'all', text: '' },
    agent: { match: 'all', text: '' },
    session: { match: 'all', text: '' },
  }
}

/** An empty exact value is a selection; it is never silently changed to all. */
export function MemoryIncrementalScope({
  value,
  onChange,
  disabled = false,
}: {
  value: MemoryScopeDraft
  onChange: (value: MemoryScopeDraft) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  return (
    <fieldset disabled={disabled} className="space-y-space-base">
      <legend className="mb-space-sm text-sm font-medium">
        {t('memory.incremental.scope')}
      </legend>
      <div className="grid gap-space-base md:grid-cols-3">
        {(['user', 'agent', 'session'] as const).map((dimension) => {
          const choice = value[dimension]
          const id = `incremental-scope-${dimension}`
          const update = (patch: Partial<MemoryScopeChoice>) =>
            onChange({ ...value, [dimension]: { ...choice, ...patch } })
          return (
            <div key={dimension} className="space-y-space-sm">
              <Label htmlFor={`${id}-match`}>
                {t(`memory.incremental.scopeFields.${dimension}`)}
              </Label>
              <Select
                value={choice.match}
                disabled={disabled}
                onValueChange={(match) => {
                  if (match === 'all' || match === 'exact') update({ match })
                }}
              >
                <SelectTrigger id={`${id}-match`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('memory.incremental.allValues')}
                  </SelectItem>
                  <SelectItem value="exact">
                    {t('memory.incremental.exactValue')}
                  </SelectItem>
                </SelectContent>
              </Select>
              {choice.match === 'exact' && (
                <Input
                  id={id}
                  aria-label={t(`memory.incremental.scopeFields.${dimension}`)}
                  value={choice.text}
                  onChange={(event) => update({ text: event.target.value })}
                  autoComplete="off"
                />
              )}
            </div>
          )
        })}
      </div>
      <p className="text-xs text-fg-muted">
        {t('memory.incremental.exactScopeHint')}
      </p>
    </fieldset>
  )
}
