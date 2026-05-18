import type { FC, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ListPageState = 'content' | 'loading' | 'empty' | 'error'

interface ListPageTemplateProps {
  title?: ReactNode
  description?: ReactNode
  headerActions?: ReactNode
  hideHeader?: boolean

  stats?: ReactNode

  toolbarLeft?: ReactNode
  toolbarRight?: ReactNode

  pagination?: ReactNode

  state?: ListPageState
  emptyState?: ReactNode
  loadingState?: ReactNode
  errorState?: ReactNode

  className?: string
  children: ReactNode
}

export const ListPageTemplate: FC<ListPageTemplateProps> = ({
  title,
  description,
  headerActions,
  hideHeader,
  stats,
  toolbarLeft,
  toolbarRight,
  pagination,
  state = 'content',
  emptyState,
  loadingState,
  errorState,
  className,
  children,
}) => {
  const renderBody = () => {
    if (state === 'empty' && emptyState) {
      return (
        <div className="flex flex-1 items-center justify-center">
          {emptyState}
        </div>
      )
    }
    if (state === 'loading' && loadingState) {
      return (
        <div className="flex flex-1 items-center justify-center">
          {loadingState}
        </div>
      )
    }
    if (state === 'error' && errorState) {
      return (
        <div className="flex flex-1 items-center justify-center">
          {errorState}
        </div>
      )
    }
    return (
      <>
        <div
          data-scroll-root="list-body"
          className="scroll-area -mx-1 flex flex-1 flex-col overflow-y-auto px-1 pb-2 pt-1"
        >
          {children}
        </div>
        {pagination}
      </>
    )
  }

  return (
    <div className={cn('p-space-lg flex h-full min-h-0 flex-col', className)}>
      {!hideHeader && (title || description || headerActions) ? (
        <div className="mb-4 flex items-start justify-between">
          <div>
            {title ? (
              <h1 className="text-xl font-semibold text-text-primary">
                {title}
              </h1>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm text-text-secondary">{description}</p>
            ) : null}
          </div>
          {headerActions ? (
            <div className="flex items-center space-x-3">{headerActions}</div>
          ) : null}
        </div>
      ) : null}

      {stats ? <div className="mb-4">{stats}</div> : null}

      {toolbarLeft || toolbarRight ? (
        <div className="mb-4 flex items-center space-x-4">
          {toolbarLeft ? (
            <div className="max-w-md flex-1">{toolbarLeft}</div>
          ) : (
            <div className="flex-1" />
          )}
          {toolbarRight ? (
            <div className="flex items-center space-x-2">{toolbarRight}</div>
          ) : null}
        </div>
      ) : null}

      {renderBody()}
    </div>
  )
}

ListPageTemplate.displayName = 'ListPageTemplate'
