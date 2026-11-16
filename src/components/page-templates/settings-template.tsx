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
  className?: string
  /** `SettingSection`s. */
  children: ReactNode
}

/**
 * Settings page skeleton: one centred 720px column (scaled with text size) of
 * `SettingSection` / `SettingRow`, so the title and content never jump
 * between settings pages. Inside the app shell the actions move to the end
 * of the card header, beside the settings breadcrumb; the section title and
 * lead stay at the top of the column.
 */
export function SettingsTemplate({
  title,
  description,
  actions,
  tabs,
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
        <div className="flex min-h-[var(--control-height-lg)] shrink-0 items-stretch overflow-x-auto border-b border-border-subtle px-space-md">
          {tabs}
        </div>
      ) : null}
      <div
        data-scroll-root="settings-body"
        className="scroll-area min-h-0 flex-1 overflow-y-auto px-space-md py-space-lg sm:px-space-xl"
      >
        <div className="mx-auto w-full max-w-[calc(45rem*var(--text-scale,1))]">
          {title || description || inlineActions ? (
            <div className="mb-space-lg flex flex-wrap items-start gap-space-md">
              <div className="min-w-0 flex-1 basis-60">
                {title ? (
                  <h2 className="text-base font-semibold text-text-primary">
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p className="mt-space-2xs text-sm text-text-secondary">
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
