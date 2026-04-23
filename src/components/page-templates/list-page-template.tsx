import React from 'react'
import { cn } from '@/lib/utils'

type ListPageState = 'content' | 'loading' | 'empty' | 'error'

interface ListPageTemplateProps {
  title: React.ReactNode
  description?: React.ReactNode
  headerActions?: React.ReactNode

  stats?: React.ReactNode

  toolbarLeft?: React.ReactNode
  toolbarRight?: React.ReactNode

  pagination?: React.ReactNode

  state?: ListPageState
  emptyState?: React.ReactNode
  loadingState?: React.ReactNode
  errorState?: React.ReactNode

  className?: string
  children: React.ReactNode
}

export const ListPageTemplate: React.FC<ListPageTemplateProps> = ({
  title,
  description,
  headerActions,
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
        <div className="flex-1 flex items-center justify-center">{emptyState}</div>
      )
    }
    if (state === 'loading' && loadingState) {
      return (
        <div className="flex-1 flex items-center justify-center">{loadingState}</div>
      )
    }
    if (state === 'error' && errorState) {
      return (
        <div className="flex-1 flex items-center justify-center">{errorState}</div>
      )
    }
    return (
      <>
        <div className="flex-1 overflow-y-auto pt-1 pb-2 -mx-1 px-1">{children}</div>
        {pagination}
      </>
    )
  }

  return (
    <div className={cn('h-full flex flex-col p-6', className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
          {description ? (
            <p className="text-sm text-text-secondary mt-1">{description}</p>
          ) : null}
        </div>
        {headerActions ? (
          <div className="flex items-center space-x-3">{headerActions}</div>
        ) : null}
      </div>

      {stats ? <div className="mb-4">{stats}</div> : null}

      {toolbarLeft || toolbarRight ? (
        <div className="flex items-center space-x-4 mb-4">
          {toolbarLeft ? (
            <div className="flex-1 max-w-md">{toolbarLeft}</div>
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
