import React from 'react'
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AppScene } from './types'

interface BasePageStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  scene?: AppScene
  compact?: boolean
}

interface PageLoadingStateProps extends BasePageStateProps {
  title?: React.ReactNode
  description?: React.ReactNode
}

interface PageEmptyStateProps extends BasePageStateProps {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  icon?: React.ReactNode
}

interface PageErrorStateProps extends BasePageStateProps {
  title?: React.ReactNode
  description?: React.ReactNode
  retryLabel?: string
  onRetry?: () => void
}

const PageStateShell: React.FC<
  React.PropsWithChildren<BasePageStateProps & { className?: string }>
> = ({ scene: _scene = AppScene.CONSOLE, compact = false, className, children, ...props }) => {
  return (
    <div
      className={cn(
        'flex h-full min-h-[240px] w-full items-center justify-center',
        compact ? 'p-space-base' : 'p-space-lg',
        className,
      )}
      {...props}
    >
      <div className="flex w-full max-w-xl flex-col items-center gap-space-md p-space-xl text-center">
        {children}
      </div>
    </div>
  )
}

export const PageLoadingState: React.FC<PageLoadingStateProps> = ({
  title = '页面加载中',
  description = '正在准备当前内容，请稍候。',
  ...props
}) => {
  return (
    <PageStateShell {...props}>
      <div className="flex h-12 w-12 items-center justify-center rounded-radius-full bg-components-page-state-icon-bg text-components-page-state-icon">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
      <div className="flex flex-col gap-space-xs">
        <h2 className="text-lg font-semibold text-components-page-state-title">{title}</h2>
        {description ? (
          <p className="text-sm text-components-page-state-description">{description}</p>
        ) : null}
      </div>
    </PageStateShell>
  )
}

export const PageEmptyState: React.FC<PageEmptyStateProps> = ({
  title,
  description,
  action,
  icon,
  ...props
}) => {
  return (
    <PageStateShell {...props}>
      <div className="flex h-12 w-12 items-center justify-center rounded-radius-full bg-components-page-state-icon-bg text-components-page-state-icon">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <div className="flex flex-col gap-space-xs">
        <h2 className="text-lg font-semibold text-components-page-state-title">{title}</h2>
        {description ? (
          <p className="text-sm text-components-page-state-description">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex items-center gap-space-sm">{action}</div> : null}
    </PageStateShell>
  )
}

export const PageErrorState: React.FC<PageErrorStateProps> = ({
  title = '页面加载失败',
  description = '当前内容暂时不可用，请稍后重试。',
  retryLabel = '重试',
  onRetry,
  ...props
}) => {
  return (
    <PageStateShell {...props}>
      <div className="flex h-12 w-12 items-center justify-center rounded-radius-full bg-state-error-subtle text-state-error">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-space-xs">
        <h2 className="text-lg font-semibold text-components-page-state-title">{title}</h2>
        {description ? (
          <p className="text-sm text-components-page-state-description">{description}</p>
        ) : null}
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </PageStateShell>
  )
}
