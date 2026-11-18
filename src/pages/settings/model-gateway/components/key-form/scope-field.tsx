import { Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { GatewayCatalog } from '@/api/model-gateway'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { callableModels, type KeyScope } from '../../catalog'
import { PREFIX } from '../../utils'
import { ScopeTree } from './scope-tree'

const PREVIEW_LIMIT = 12

interface ScopeFieldProps {
  catalog: GatewayCatalog
  scope: KeyScope
  disabled?: boolean
  onChange: (scope: KeyScope) => void
}

/** "All models" or a picked set, with a live list of what it can call. */
export function ScopeField({
  catalog,
  scope,
  disabled,
  onChange,
}: ScopeFieldProps) {
  const { t } = useTranslation()
  const callable = callableModels(catalog, scope)
  const options = [
    {
      value: 'all',
      title: t(`${PREFIX}.keyForm.scopeAll`),
      hint: t(`${PREFIX}.keyForm.scopeAllHint`),
    },
    {
      value: 'pick',
      title: t(`${PREFIX}.keyForm.scopePick`),
      hint: t(`${PREFIX}.keyForm.scopePickHint`),
    },
  ]
  const mode = scope.allModels ? 'all' : 'pick'
  let preview: string
  if (scope.allModels)
    preview = t(`${PREFIX}.keyForm.previewAll`, { count: callable.length })
  else if (callable.length > 0)
    preview = t(`${PREFIX}.keyForm.previewSome`, { count: callable.length })
  else preview = t(`${PREFIX}.keyForm.previewNone`)

  return (
    <fieldset className="flex flex-col gap-space-sm">
      <legend className="mb-space-sm text-sm font-medium text-fg">
        {t(`${PREFIX}.keyForm.scopeLegend`)}
      </legend>
      <RadioGroup
        value={mode}
        disabled={disabled}
        onValueChange={(value) =>
          onChange({ ...scope, allModels: value === 'all' })
        }
        className="grid gap-space-sm sm:grid-cols-2"
      >
        {options.map((option) => {
          const id = `gateway-key-scope-${option.value}`
          return (
            // The radio's hit area stretches over the whole card.
            <div
              key={option.value}
              className={cn(
                'relative flex cursor-pointer items-start gap-space-sm rounded-radius-lg border p-space-md transition-colors',
                mode === option.value
                  ? 'border-accent-solid bg-accent-soft'
                  : 'border-line hover:bg-fill-hover',
              )}
            >
              <RadioGroupItem
                id={id}
                value={option.value}
                aria-labelledby={`${id}-title`}
                aria-describedby={`${id}-hint`}
                className="mt-space-2xs after:absolute after:inset-0 after:rounded-radius-lg after:content-['']"
              />
              <span className="min-w-0">
                <span
                  id={`${id}-title`}
                  className="block text-sm font-medium text-fg"
                >
                  {option.title}
                </span>
                <span
                  id={`${id}-hint`}
                  className="block text-xs text-fg-subtle"
                >
                  {option.hint}
                </span>
              </span>
            </div>
          )
        })}
      </RadioGroup>
      {scope.allModels ? null : (
        <ScopeTree
          catalog={catalog}
          scope={scope}
          disabled={disabled}
          onChange={onChange}
        />
      )}
      <div
        aria-live="polite"
        className="flex gap-space-sm rounded-radius-md border border-info-line bg-info-soft p-space-md"
      >
        <Info
          className="mt-space-2xs size-icon-sm shrink-0 text-info-fg"
          aria-hidden="true"
        />
        <div className="min-w-0 text-sm">
          <p className="font-medium text-fg">{preview}</p>
          {callable.length > 0 ? (
            <ul className="mt-space-xs flex flex-wrap gap-space-xs">
              {callable.slice(0, PREVIEW_LIMIT).map((model) => (
                <li
                  key={model.model_id}
                  className="rounded-radius-sm border border-line-subtle bg-surface px-space-xs font-mono text-xs text-fg"
                >
                  {model.call_name}
                </li>
              ))}
              {callable.length > PREVIEW_LIMIT ? (
                <li className="px-space-xs text-xs text-fg-subtle">
                  {t(`${PREFIX}.keyForm.previewMore`, {
                    count: callable.length - PREVIEW_LIMIT,
                  })}
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      </div>
    </fieldset>
  )
}
