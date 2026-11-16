import type { ReactNode } from 'react'

/**
 * The pager strip under a knowledge section's table, matching the
 * CollectionTemplate footer (DetailTemplate has no footer slot yet).
 */
export function SectionFooter({
  note,
  children,
}: {
  note?: ReactNode
  children?: ReactNode
}) {
  return (
    <div
      data-slot="section-footer"
      className="flex min-h-[var(--control-height)] shrink-0 flex-wrap items-center gap-x-space-md border-t border-border-subtle py-space-2xs pr-space-sm pl-space-md text-xs text-text-tertiary"
    >
      {note ? <div className="min-w-0">{note}</div> : null}
      <span className="flex-1" aria-hidden="true" />
      {children}
    </div>
  )
}
