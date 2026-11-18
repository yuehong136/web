import { useId, type ReactNode } from 'react'

/**
 * A titled block of the knowledge settings form, divided by a hairline
 * instead of a card so the column reads as one form.
 */
export function SettingsSection({
  title,
  children,
}: {
  title: ReactNode
  children: ReactNode
}) {
  const headingId = useId()
  return (
    <section
      aria-labelledby={headingId}
      data-slot="knowledge-settings-section"
      className="border-t border-line-subtle pt-space-lg first:border-t-0 first:pt-0"
    >
      <h2
        id={headingId}
        className="mb-space-base text-sm font-semibold text-fg"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
