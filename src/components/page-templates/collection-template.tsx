import type { ReactNode } from 'react'
import { PageHeader } from '@/components/patterns/page-header'
import {
  PageTitleBar,
  type PageTitleCrumb,
} from '@/components/patterns/page-title-bar'
import {
  Inspector,
  type InspectorPanelProps,
} from '@/components/patterns/inspector'
import {
  WorkbenchHeaderSlot,
  useWorkbenchHeader,
} from '@/components/layout/workbench-header'
import { cn } from '@/lib/utils'
import { resolveTemplateState, type TemplateState } from './template-state'

export type CollectionState = TemplateState

export interface CollectionTemplateProps {
  title?: ReactNode
  /** Total shown after the title. */
  count?: ReactNode
  /** Screen-reader wording for the count, e.g. "Apps: 20". */
  countLabel?: string
  crumbs?: PageTitleCrumb[]
  leading?: ReactNode
  /** `InlineStats` under the title (whole-collection figures only). */
  stats?: ReactNode
  /** Short description; shown on the title's second line when no stats. */
  description?: ReactNode
  /** Header actions, primary last. Hide the primary one in the empty state. */
  actions?: ReactNode
  hideHeader?: boolean
  /** Usually a `FilterBar`. */
  filterBar?: ReactNode
  state?: CollectionState
  /** Defaults to the shared loading state. */
  loadingState?: ReactNode
  emptyState?: ReactNode
  /** Defaults to the shared error state (without retry). */
  errorState?: ReactNode
  /** Footer end: `Pager` or `LoadMore`. Shown with content only. */
  footer?: ReactNode
  /** Footer start: a page-scope note or loaded count. */
  footerNote?: ReactNode
  /** A `BulkActionBar`; pass null when nothing is selected. */
  bulkActions?: ReactNode
  /** Opens a right-hand Inspector beside the body. */
  inspector?: InspectorPanelProps
  /**
   * @deprecated `inset` keeps the padded `ListPageTemplate` look for pages not
   * yet migrated. New pages use the default `flush` layout.
   */
  appearance?: 'flush' | 'inset'
  className?: string
  /** `ResourceList`, `ResourceGrid` or `DataTable`. */
  children: ReactNode
}

/**
 * Collection page skeleton: 48px title bar (title, count, InlineStats,
 * actions), FilterBar strip, rows or grid, page states, pager footer and an
 * optional floating BulkActionBar / Inspector. Data stays in the page.
 * Inside the app shell the title bar moves into the card header instead of
 * stacking a second title row.
 */
export function CollectionTemplate({
  title,
  count,
  countLabel,
  crumbs,
  leading,
  stats,
  description,
  actions,
  hideHeader = false,
  filterBar,
  state = 'content',
  loadingState,
  emptyState,
  errorState,
  footer,
  footerNote,
  bulkActions,
  inspector,
  appearance = 'flush',
  className,
  children,
}: CollectionTemplateProps) {
  const inset = appearance === 'inset'
  const { bindRoot, placement, target } = useWorkbenchHeader('title')
  const stateNode = resolveTemplateState(
    state,
    { loadingState, emptyState, errorState },
    !inset,
  )

  if (inset) {
    return (
      <div className={cn('flex h-full min-h-0 flex-col p-space-lg', className)}>
        {!hideHeader && (title || description || actions) ? (
          <PageHeader
            title={title}
            description={description}
            actions={actions}
            wrapActions
            titleSize="md"
            surface="plain"
            className="mb-space-lg"
          />
        ) : null}
        {stats ? <div className="mb-space-lg">{stats}</div> : null}
        {filterBar ? <div className="mb-space-base">{filterBar}</div> : null}
        {stateNode ? (
          <div className="flex flex-1 items-center justify-center">
            {stateNode}
          </div>
        ) : (
          <>
            <div
              data-scroll-root="list-body"
              className="scroll-area -mx-1 flex flex-1 flex-col overflow-y-auto px-1 pt-1 pb-2"
            >
              {children}
            </div>
            {footer}
          </>
        )}
      </div>
    )
  }

  const body = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {stateNode ? (
        <div className="scroll-area flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto">
          {stateNode}
        </div>
      ) : (
        <>
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              data-scroll-root="collection-body"
              className={cn(
                'scroll-area min-h-0 flex-1 overflow-y-auto',
                bulkActions &&
                  'pb-[calc(var(--control-height)+var(--space-xl))]',
              )}
            >
              {children}
            </div>
            {bulkActions}
          </div>
          {footer || footerNote ? (
            <div
              data-slot="collection-footer"
              className="flex min-h-[var(--control-height)] shrink-0 flex-wrap items-center gap-x-space-md border-t border-border-subtle py-space-2xs pr-space-sm pl-space-md text-xs text-text-tertiary"
            >
              {footerNote ? <div className="min-w-0">{footerNote}</div> : null}
              <span className="flex-1" aria-hidden="true" />
              {footer}
            </div>
          ) : null}
        </>
      )}
    </div>
  )

  const titleBar = {
    title,
    count,
    countLabel,
    crumbs,
    leading,
    subline: stats ?? description,
    actions,
  }
  return (
    <div
      ref={bindRoot}
      data-slot="collection-template"
      className={cn('flex h-full min-h-0 min-w-0 flex-col', className)}
    >
      {!hideHeader && title ? (
        <WorkbenchHeaderSlot
          placement={placement}
          target={target}
          inline={<PageTitleBar {...titleBar} />}
        >
          <PageTitleBar {...titleBar} placement="workbench" />
        </WorkbenchHeaderSlot>
      ) : null}
      {filterBar ? (
        <div className="shrink-0 border-b border-border-subtle py-space-sm pr-space-sm pl-space-md">
          {filterBar}
        </div>
      ) : null}
      {inspector ? <Inspector {...inspector}>{body}</Inspector> : body}
    </div>
  )
}
