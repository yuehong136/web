import type { FC, ReactNode } from 'react'
import { PageToolbar } from '@/components/patterns/page-toolbar'
import { CollectionTemplate } from './collection-template'
import type { TemplateState } from './template-state'

interface ListPageTemplateProps {
  title?: ReactNode
  description?: ReactNode
  headerActions?: ReactNode
  hideHeader?: boolean

  stats?: ReactNode

  toolbarLeft?: ReactNode
  toolbarRight?: ReactNode

  pagination?: ReactNode

  state?: TemplateState
  emptyState?: ReactNode
  loadingState?: ReactNode
  errorState?: ReactNode

  className?: string
  children: ReactNode
}

/**
 * @deprecated Use `CollectionTemplate` with `FilterBar`, `Pager` and
 * `ResourceRow`/`DataTable`. This keeps the padded look (CollectionTemplate's
 * `inset` appearance) for pages that have not migrated yet.
 */
export const ListPageTemplate: FC<ListPageTemplateProps> = ({
  headerActions,
  toolbarLeft,
  toolbarRight,
  pagination,
  ...props
}) => (
  <CollectionTemplate
    {...props}
    appearance="inset"
    actions={headerActions}
    filterBar={
      toolbarLeft || toolbarRight ? (
        <PageToolbar
          left={toolbarLeft}
          right={toolbarRight}
          wrap
          surface="plain"
        />
      ) : undefined
    }
    footer={pagination}
  />
)

ListPageTemplate.displayName = 'ListPageTemplate'
