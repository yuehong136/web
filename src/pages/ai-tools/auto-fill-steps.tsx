import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AutoFillStep = 1 | 2 | 3

const STEPS = [
  { id: 1, key: 'upload' },
  { id: 2, key: 'fill' },
  { id: 3, key: 'download' },
] as const

/**
 * The three auto-fill steps for the page header: numbered (or checked)
 * markers joined by a rule, the current one marked with aria-current. On
 * phones only the current step keeps its label.
 */
export const AutoFillSteps = ({ current }: { current: AutoFillStep }) => {
  const { t } = useTranslation()
  return (
    <ol
      aria-label={t('aiTools.autoFill.steps.label')}
      className="flex items-center gap-space-xs"
    >
      {STEPS.map((step, index) => {
        const done = step.id < current
        const active = step.id === current
        const label = t(`aiTools.autoFill.steps.${step.key}`)
        return (
          <Fragment key={step.id}>
            {index > 0 ? (
              <li
                aria-hidden="true"
                className={cn(
                  'h-px w-space-md',
                  done || active
                    ? 'bg-components-steps-line-completed'
                    : 'bg-components-steps-line',
                )}
              />
            ) : null}
            <li
              aria-current={active ? 'step' : undefined}
              className="flex items-center gap-space-xs text-sm"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-radius-full text-xs font-medium tabular-nums',
                  done &&
                    'bg-components-steps-completed-bg text-components-steps-completed-text',
                  active &&
                    'bg-components-steps-active-bg text-components-steps-active-text',
                  !done &&
                    !active &&
                    'bg-components-steps-inactive-bg text-components-steps-inactive-text',
                )}
              >
                {done ? <Check className="size-icon-xs" /> : step.id}
              </span>
              <span
                aria-hidden={done ? true : undefined}
                className={cn(
                  active
                    ? 'font-medium text-text-primary'
                    : 'text-text-secondary max-md:sr-only',
                )}
              >
                {label}
              </span>
              {done ? (
                <span className="sr-only">
                  {t('aiTools.autoFill.steps.completed', { step: label })}
                </span>
              ) : null}
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}
