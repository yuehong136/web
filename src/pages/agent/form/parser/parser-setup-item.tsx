import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlertCircle, Circle, Trash2 } from 'lucide-react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { getParserMeta, getParserSetupSummary } from './constants'
import type { ParserFormValues } from './schema'

type ParserSetupItemProps = {
  index: number
  selected: boolean
  showRemove: boolean
  onSelect: () => void
  onRemove: () => void
}

export function ParserSetupItem({
  index,
  selected,
  showRemove,
  onSelect,
  onRemove,
}: ParserSetupItemProps) {
  const { t } = useTranslation()
  const {
    control,
    formState: { errors, dirtyFields },
  } = useFormContext<ParserFormValues>()
  const setup = useWatch({
    control,
    name: `setups.${index}`,
  })

  const parserMeta = getParserMeta(t, setup?.fileFormat)
  const summary = getParserSetupSummary(t, setup)

  const hasError = Boolean(errors.setups?.[index])
  const isDirty = Boolean(dirtyFields.setups?.[index]) && !hasError
  const showState = hasError || isDirty
  const stateLabel = hasError
    ? t('flow.parserStates.needsAttention', 'Needs attention')
    : t('flow.parserStates.edited', 'Edited')
  const stateClassName = hasError ? 'text-status-warning' : 'text-text-secondary'
  const StateIcon = hasError ? AlertCircle : Circle

  return (
    <div
      className={cn(
        'border-b border-border-subtle last:border-b-0',
        selected && 'bg-background-subtle border-l-2 border-border-accent',
      )}
    >
      <div
        className={cn(
          'flex items-start gap-space-lg px-space-base py-space-lg',
          selected && 'pl-[calc(var(--spacing-space-base)-2px)]',
        )}
      >
        <button
          type="button"
          onClick={onSelect}
          className="min-w-0 flex-1 text-left"
        >
          <div className="min-w-0 space-y-space-md">
            <div className="flex min-w-0 items-center gap-space-sm">
              <span className="text-lg font-semibold leading-none text-text-primary">
                {`Parser ${index + 1}`}
              </span>
              <span
                className={cn(
                  'inline-flex items-center rounded-radius-full px-space-sm py-1 text-sm font-medium leading-none',
                  parserMeta.badgeClassName,
                )}
              >
                {parserMeta.label}
              </span>
            </div>

            <div className="truncate pr-space-sm text-base leading-7 text-text-secondary">
              {summary}
            </div>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-space-sm pt-space-xs">
          {showState ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-radius-full bg-background-subtle px-space-sm py-1 text-sm font-medium leading-none',
                stateClassName,
              )}
            >
              <StateIcon className="size-3 shrink-0" />
              {stateLabel}
            </span>
          ) : null}

          {showRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-text-secondary hover:text-text-primary"
              onClick={onRemove}
              aria-label={t('common.delete', 'Delete')}
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
