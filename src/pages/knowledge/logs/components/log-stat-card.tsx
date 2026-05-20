import type { ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { getCurrentLanguage } from '@/locales/i18n'

type LogStatVariant = 'default' | 'info' | 'warning'

const VARIANT_CLASSES: Record<
  LogStatVariant,
  { decoration: string; icon: string; iconText: string }
> = {
  default: {
    decoration: 'bg-state-focus',
    icon: 'bg-state-focus-10',
    iconText: 'text-state-focus',
  },
  info: {
    decoration: 'bg-state-focus',
    icon: 'bg-state-focus-10',
    iconText: 'text-state-focus',
  },
  warning: {
    decoration: 'bg-status-warning',
    icon: 'bg-status-warning-10',
    iconText: 'text-status-warning',
  },
}

interface LogStatCardProps {
  title: string
  value: number
  icon: ReactNode
  tooltip?: string
  children?: ReactNode
  variant?: LogStatVariant
}

export function LogStatCard({
  title,
  value,
  icon,
  tooltip,
  children,
  variant = 'default',
}: LogStatCardProps) {
  const classes = VARIANT_CLASSES[variant]

  return (
    <div className="rounded-radius-xl hover:shadow-elevation-medium relative overflow-hidden border border-components-card-border bg-components-card-bg p-5 transition-all duration-300">
      <div
        className={cn(
          'absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-20 blur-2xl',
          classes.decoration,
        )}
      />

      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
            {tooltip && (
              <Tooltip content={<p className="max-w-xs text-xs">{tooltip}</p>}>
                <HelpCircle className="h-3.5 w-3.5 cursor-help text-text-tertiary" />
              </Tooltip>
            )}
          </div>
          <div className={cn('rounded-radius-lg p-2', classes.icon)}>
            <span className={classes.iconText}>{icon}</span>
          </div>
        </div>

        <div className="mb-3 text-3xl font-bold tabular-nums text-text-primary">
          {new Intl.NumberFormat(getCurrentLanguage()).format(value)}
        </div>

        {children && (
          <div className="border-t border-border-subtle pt-3">{children}</div>
        )}
      </div>
    </div>
  )
}

interface LogStatProcessProps {
  success: number
  failed: number
  successLabel: string
  failedLabel: string
  successTip?: string
  failedTip?: string
}

export function LogStatProcess({
  success,
  failed,
  successLabel,
  failedLabel,
  successTip,
  failedTip,
}: LogStatProcessProps) {
  const successItem = (
    <LogStatProcessItem label={successLabel} value={success} tone="success" />
  )
  const failedItem = (
    <LogStatProcessItem label={failedLabel} value={failed} tone="error" />
  )

  return (
    <div className="flex gap-3">
      {successTip ? (
        <Tooltip content={<p className="text-xs">{successTip}</p>}>
          {successItem}
        </Tooltip>
      ) : (
        successItem
      )}
      {failedTip ? (
        <Tooltip content={<p className="text-xs">{failedTip}</p>}>
          {failedItem}
        </Tooltip>
      ) : (
        failedItem
      )}
    </div>
  )
}

interface LogStatProcessItemProps {
  label: string
  value: number
  tone: 'success' | 'error'
}

function LogStatProcessItem({ label, value, tone }: LogStatProcessItemProps) {
  const toneClasses =
    tone === 'success'
      ? {
          root: 'bg-status-success-10',
          dot: 'bg-status-success',
          value: 'text-status-success',
        }
      : {
          root: 'bg-status-error-10',
          dot: 'bg-status-error',
          value: 'text-status-error',
        }

  return (
    <div
      className={cn(
        'rounded-radius-lg flex flex-1 cursor-default items-center justify-between p-2',
        toneClasses.root,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn('h-1.5 w-1.5 rounded-full', toneClasses.dot)} />
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <span className={cn('text-sm font-semibold', toneClasses.value)}>
        {new Intl.NumberFormat(getCurrentLanguage()).format(value)}
      </span>
    </div>
  )
}

export function LogStatsSkeleton() {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="rounded-radius-xl h-40 animate-pulse border border-border-subtle bg-background-subtle"
        />
      ))}
    </div>
  )
}
