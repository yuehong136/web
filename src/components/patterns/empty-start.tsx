import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FileKindTile } from './file-kind-tile'

export interface EmptyStartPath {
  key: string
  icon: ReactNode
  /** Tint classes for the icon tile, e.g. the kind's avatar tone. */
  iconClassName?: string
  title: ReactNode
  description: ReactNode
  /** Short call to action under the description, e.g. "Upload". */
  cta: ReactNode
  onSelect: () => void
  /** The recommended path gets an accent outline. */
  primary?: boolean
}

export interface EmptyStartProps {
  title: ReactNode
  description?: ReactNode
  /** Art above the title; defaults to none. See `FileStackIllustration`. */
  illustration?: ReactNode
  /** Two or three ways to get started. */
  paths: EmptyStartPath[]
  /** Faded skeleton cards behind the content, hinting at the filled page. */
  ghost?: boolean
  footer?: ReactNode
  className?: string
}

/**
 * First-use empty state for a collection: optional art, one sentence on what
 * the page is for, and start paths as cards. Filtered-empty states keep using
 * `PageEmptyState`.
 */
export function EmptyStart({
  title,
  description,
  illustration,
  paths,
  ghost = true,
  footer,
  className,
}: EmptyStartProps) {
  return (
    <div
      data-slot="empty-start"
      className={cn(
        'relative flex min-h-full w-full flex-col items-center justify-center overflow-hidden px-space-lg py-space-2xl',
        className,
      )}
    >
      {ghost ? <GhostGrid /> : null}
      <div className="relative flex w-full max-w-3xl flex-col items-center gap-space-xl text-center">
        {illustration}
        <div className="flex max-w-lg flex-col items-center gap-space-sm">
          <h2 className="text-xl font-semibold text-pretty text-text-primary">
            {title}
          </h2>
          {description ? (
            <p className="text-sm text-pretty text-text-secondary">
              {description}
            </p>
          ) : null}
        </div>
        <ul className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(13.75rem,100%),1fr))] gap-space-sm text-left">
          {paths.map((path) => (
            <li key={path.key} className="min-w-0">
              <button
                type="button"
                onClick={path.onSelect}
                className={cn(
                  'flex h-full w-full flex-col items-start gap-space-sm rounded-radius-xl border bg-background-surface p-space-md text-left outline-hidden transition-[border-color,box-shadow,transform] duration-150 hover:border-border-strong hover:shadow-elevation-medium focus-visible:ring-2 focus-visible:ring-state-focus motion-safe:hover:-translate-y-0.5',
                  path.primary ? 'border-state-focus' : 'border-border-default',
                )}
              >
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-radius-lg [&_svg]:size-icon-md',
                    path.iconClassName ??
                      'bg-background-subtle text-text-secondary',
                  )}
                >
                  {path.icon}
                </span>
                <span className="flex flex-col gap-space-2xs">
                  <span className="text-sm font-semibold text-text-primary">
                    {path.title}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {path.description}
                  </span>
                </span>
                <span className="mt-auto flex items-center gap-space-2xs text-xs font-medium text-text-accent">
                  {path.cta}
                  <ArrowRight aria-hidden className="size-3.5" />
                </span>
              </button>
            </li>
          ))}
        </ul>
        {footer}
      </div>
    </div>
  )
}

function GhostGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 grid grid-cols-[repeat(auto-fill,minmax(17.5rem,1fr))] content-start gap-space-base [mask-image:linear-gradient(to_bottom,rgb(0_0_0/0.5),transparent_70%)] p-space-md"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="flex h-36 flex-col gap-space-sm rounded-radius-xl border border-border-subtle bg-background-surface p-space-md"
        >
          <div className="flex items-center gap-space-sm">
            <span
              className={cn(
                'size-9 rounded-radius-lg',
                [
                  'bg-components-avatar-5-bg',
                  'bg-components-avatar-6-bg',
                  'bg-components-avatar-7-bg',
                  'bg-components-avatar-2-bg',
                ][index],
              )}
            />
            <span className="h-2.5 w-1/2 rounded-full bg-background-subtle" />
          </div>
          <span className="h-2.5 w-11/12 rounded-full bg-background-subtle" />
          <span className="h-2.5 w-3/5 rounded-full bg-background-subtle" />
        </div>
      ))}
    </div>
  )
}

/** Three tilted file tiles on the AI halo; for knowledge and document states. */
export function FileStackIllustration({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('relative h-28 w-48 [&>*]:absolute', className)}
    >
      <span className="-inset-10 rounded-full bg-[radial-gradient(closest-side,var(--color-components-ai-glow),transparent_80%)]" />
      <FileKindTile
        name="pdf"
        size="lg"
        className="top-6 left-5 h-20 w-16 -rotate-10 items-end justify-start rounded-radius-lg p-space-sm text-xs"
      />
      <FileKindTile
        name="xlsx"
        size="lg"
        className="top-6 right-5 h-20 w-16 rotate-10 items-end justify-start rounded-radius-lg p-space-sm text-xs"
      />
      <FileKindTile
        name="docx"
        size="lg"
        className="top-1 left-1/2 h-22 w-[4.25rem] -translate-x-1/2 items-end justify-start rounded-radius-lg p-space-sm text-xs shadow-elevation-medium"
      />
    </div>
  )
}
