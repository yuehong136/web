import type { FC, ReactNode } from 'react'
import { PageHeader, PageToolbar } from '@/components/patterns'
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
          className="scroll-area -mx-1 flex flex-1 flex-col overflow-y-auto px-1 pt-1 pb-2"
        >
          {children}
        </div>
        {pagination}
      </>
    )
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col p-space-lg', className)}>
      {!hideHeader && (title || description || headerActions) ? (
        <PageHeader
          title={title}
          description={description}
          actions={headerActions}
          wrapActions
          titleSize="md"
          surface="plain"
          className="mb-space-lg"
        />
      ) : null}

      {stats ? <div className="mb-space-lg">{stats}</div> : null}

      {toolbarLeft || toolbarRight ? (
        <PageToolbar
          left={toolbarLeft}
          right={toolbarRight}
          wrap
          surface="plain"
          className="mb-space-base"
        />
      ) : null}

      {renderBody()}
    </div>
  )
}

ListPageTemplate.displayName = 'ListPageTemplate'
