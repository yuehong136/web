import type { ReactNode } from 'react'
import { AlertTriangle, CircleAlert, X } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

/**
 * A notice inside the sign-in card: a failed request (`error`) or an expired
 * session (`warning`), always with an icon so colour is not the only signal.
 */
export function AuthAlert({
  tone,
  title,
  children,
  dismissLabel,
  onDismiss,
  className,
}: {
  tone: 'error' | 'warning'
  title?: ReactNode
  children?: ReactNode
  /** Shown with `onDismiss`: the close button's accessible name. */
  dismissLabel?: string
  onDismiss?: () => void
  className?: string
}) {
  const Icon = tone === 'error' ? CircleAlert : AlertTriangle
  return (
    <Alert
      role="alert"
      variant={tone === 'error' ? 'destructive' : 'warning'}
      data-auth-alert={tone}
      className={cn(
        'flex items-start gap-space-sm motion-safe:animate-fade-in',
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-space-2xs size-icon-sm shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-space-2xs text-sm">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? (
          <div className={cn(title && 'text-xs')}>{children}</div>
        ) : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="-me-space-xs rounded-radius-md p-space-2xs outline-hidden transition-colors hover:bg-fill-hover focus-visible:ring-2 focus-visible:ring-line-focus"
        >
          <X aria-hidden="true" className="size-icon-sm" />
        </button>
      ) : null}
    </Alert>
  )
}
