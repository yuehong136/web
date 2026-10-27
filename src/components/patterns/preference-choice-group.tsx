import { useId, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PreferenceChoice<T extends string> {
  value: T
  label: string
  description?: string
  icon?: ReactNode
  preview?: ReactNode
}

/** Native radios keep arrow-key navigation and selection semantics together. */
export function PreferenceChoiceGroup<T extends string>({
  label,
  description,
  value,
  choices,
  onChange,
  className,
}: {
  label: string
  description?: string
  value: T
  choices: readonly PreferenceChoice<T>[]
  onChange: (value: T) => void
  className?: string
}) {
  const name = useId()
  return (
    <fieldset className="min-w-0 space-y-space-base">
      <legend className="text-sm font-semibold text-text-primary">
        {label}
      </legend>
      {description && (
        <p className="text-sm text-text-secondary">{description}</p>
      )}
      <div className={cn('grid grid-cols-2 gap-space-sm', className)}>
        {choices.map((choice) => (
          <label
            key={choice.value}
            htmlFor={`${name}-${choice.value}`}
            className="min-w-0 cursor-pointer"
          >
            <input
              id={`${name}-${choice.value}`}
              className="peer sr-only"
              type="radio"
              name={name}
              value={choice.value}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
            />
            <span className="flex h-full min-w-0 flex-col overflow-hidden rounded-radius-lg border border-border-default bg-background-surface text-text-primary transition-colors peer-checked:border-state-focus peer-checked:bg-state-selected-bg peer-focus-visible:ring-2 peer-focus-visible:ring-state-focus peer-focus-visible:ring-offset-2 hover:border-border-strong">
              {choice.preview && (
                <span aria-hidden="true">{choice.preview}</span>
              )}
              <span className="flex min-w-0 items-start gap-space-sm p-space-base">
                {choice.icon && <span className="shrink-0">{choice.icon}</span>}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {choice.label}
                  </span>
                  {choice.description && (
                    <span className="mt-space-xs block text-xs leading-relaxed text-text-secondary">
                      {choice.description}
                    </span>
                  )}
                </span>
                <Check
                  aria-hidden="true"
                  className={cn(
                    'size-icon-sm shrink-0 text-text-accent',
                    value !== choice.value && 'invisible',
                  )}
                />
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
