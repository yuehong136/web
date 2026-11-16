import type { ReactNode } from 'react'
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

export interface DetailTemplateProps {
  /** The entity or section name, rendered as the page h1. */
  title: ReactNode
  /** Ancestors before the title, e.g. `[{ label: 'Knowledge', to: '/knowledge' }]`. */
  crumbs?: PageTitleCrumb[]
  /** Usually the entity's `EntityAvatar`. */
  leading?: ReactNode
  count?: ReactNode
  countLabel?: string
  /** `InlineStats` or a one-line description under the title. */
  subline?: ReactNode
  actions?: ReactNode
  /**
   * Tab strip: `RouteTabs` for routed sections, or ui/tabs `TabsList` for
   * in-page tabs (wrap the template in `Tabs` so content can switch).
   */
  tabs?: ReactNode
  /** A `FilterBar` strip under the tabs. */
  toolbar?: ReactNode
  state?: Exclude<TemplateState, 'empty'>
  loadingState?: ReactNode
  errorState?: ReactNode
  /** Right-hand Inspector for the selected item (Esc closes, focus returns). */
  inspector?: InspectorPanelProps
  /** `auto` scrolls the body; `none` lets children own their scroll areas. */
  bodyScroll?: 'auto' | 'none'
  className?: string
  children: ReactNode
}

/**
 * Detail page skeleton: crumbs + title bar, tabs, optional toolbar, the body
 * and an Inspector slot. Replaces stacked headers and back arrows; the
 * crumbs are the way back. Inside the app shell the title bar moves into the
 * card header.
 */
export function DetailTemplate({
  title,
  crumbs,
  leading,
  count,
  countLabel,
  subline,
  actions,
  tabs,
  toolbar,
  state = 'content',
  loadingState,
  errorState,
  inspector,
  bodyScroll = 'auto',
  className,
  children,
}: DetailTemplateProps) {
  const { bindRoot, placement, target } = useWorkbenchHeader('title')
  const stateNode = resolveTemplateState(
    state,
    { loadingState, errorState },
    true,
  )
  const titleBar = {
    title,
    crumbs,
    leading,
    count,
    countLabel,
    subline,
    actions,
  }
  const body = stateNode ? (
    <div className="scroll-area flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto">
      {stateNode}
    </div>
  ) : (
    <div
      data-scroll-root={bodyScroll === 'auto' ? 'detail-body' : undefined}
      className={cn(
        'relative flex min-h-0 min-w-0 flex-1 flex-col',
        bodyScroll === 'auto'
          ? 'scroll-area overflow-y-auto'
          : 'overflow-hidden',
      )}
    >
      {children}
    </div>
  )
  return (
    <div
      ref={bindRoot}
      data-slot="detail-template"
      className={cn('flex h-full min-h-0 min-w-0 flex-col', className)}
    >
      <WorkbenchHeaderSlot
        placement={placement}
        target={target}
        inline={<PageTitleBar {...titleBar} />}
      >
        <PageTitleBar {...titleBar} placement="workbench" />
      </WorkbenchHeaderSlot>
      {tabs ? (
        <div className="flex min-h-[var(--control-height-lg)] shrink-0 items-stretch overflow-x-auto border-b border-border-subtle px-space-md">
          {tabs}
        </div>
      ) : null}
      {toolbar ? (
        <div className="shrink-0 border-b border-border-subtle py-space-sm pr-space-sm pl-space-md">
          {toolbar}
        </div>
      ) : null}
      {inspector ? <Inspector {...inspector}>{body}</Inspector> : body}
    </div>
  )
}
