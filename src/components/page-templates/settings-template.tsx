import type { ReactNode } from 'react'
import {
  WorkbenchHeaderSlot,
  useWorkbenchHeader,
} from '@/components/layout/workbench-header'
import { cn } from '@/lib/utils'

export interface SettingsTemplateProps {
  /** Section title (h2; the settings shell owns the page h1). */
  title?: ReactNode
  /** One-sentence lead under the title: what changes and when it applies. */
  description?: ReactNode
  actions?: ReactNode
  /** Tab strip above the column, e.g. `RouteTabs` for provider/gateway tabs. */
  tabs?: ReactNode
  /**
   * `form` keeps a readable 720px column; `wide` (up to 1040px) suits pages
   * of tables and card grids such as providers, gateway, keys and users.
   */
  width?: 'form' | 'wide'
  className?: string
  /** `SettingSection`s. */
  children: ReactNode
}

const WIDTHS = {
  form: 'max-w-[calc(45rem*var(--text-scale,1))]',
  wide: 'max-w-[calc(65rem*var(--text-scale,1))]',
} as const

/**
 * Settings page skeleton: one centred column (720px for forms, 1040px for
 * tables and card grids, scaled with text size) of `SettingSection` /
 * `SettingRow`, so the title and content never jump between settings pages.
 * Inside the app shell the actions move to the end of the card header,
 * beside the settings breadcrumb; the section title and lead stay at the
 * top of the column.
 */
export function SettingsTemplate({
  title,
  description,
  actions,
  tabs,
  width = 'form',
  className,
  children,
}: SettingsTemplateProps) {
  const { bindRoot, placement, target } = useWorkbenchHeader('actions')
  const inlineActions = actions && placement === 'inline' ? actions : null
  return (
    <div
      ref={bindRoot}
      data-slot="settings-template"
      className={cn('flex h-full min-h-0 min-w-0 flex-col', className)}
    >
      {actions ? (
        <WorkbenchHeaderSlot
          placement={placement}
          target={target}
          inline={null}
        >
          {actions}
        </WorkbenchHeaderSlot>
      ) : null}
      {tabs ? (
        <div className="scrollbar-none flex min-h-[var(--control-height-lg)] shrink-0 items-stretch overflow-x-auto border-b border-line-subtle px-space-md">
          {tabs}
        </div>
      ) : null}
      <div
        data-scroll-root="settings-body"
        className="scroll-area min-h-0 flex-1 overflow-y-auto px-space-md py-space-lg sm:px-space-xl"
      >
        <div data-width={width} className={cn('mx-auto w-full', WIDTHS[width])}>
          {title || description || inlineActions ? (
            <div className="mb-space-lg flex flex-wrap items-start gap-space-md">
              <div className="min-w-0 flex-1 basis-60">
                {title ? (
                  <h2 className="text-base font-semibold text-fg">{title}</h2>
                ) : null}
                {description ? (
                  <p className="mt-space-2xs text-sm text-fg-muted">
                    {description}
                  </p>
                ) : null}
              </div>
              {inlineActions ? (
                <div className="flex shrink-0 items-center gap-space-sm">
                  {inlineActions}
                </div>
              ) : null}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  )
}
