import { useTranslation } from 'react-i18next'
import { ResourceListSkeletonRow } from '@/components/ui/resource-list'
import { cn } from '@/lib/utils'

/** Identity tints the placeholder tiles cycle through, as real items do. */
const TILE_TONES = [
  'bg-avatar-1-bg',
  'bg-avatar-5-bg',
  'bg-avatar-7-bg',
  'bg-avatar-3-bg',
  'bg-avatar-6-bg',
  'bg-avatar-2-bg',
] as const

const Bar = ({ className }: { className: string }) => (
  <div
    aria-hidden="true"
    className={cn('skeleton-shimmer rounded-radius-sm', className)}
  />
)

/** A resource card: identity tile, name, description, meta line. */
export function ResourceCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      aria-hidden="true"
      data-slot="resource-card-skeleton"
      className="flex min-h-36 flex-col gap-space-sm rounded-radius-xl border border-line-subtle bg-surface p-space-md"
    >
      <div className="flex items-center gap-space-sm">
        <div
          className={cn(
            'size-9 shrink-0 rounded-radius-lg opacity-70',
            TILE_TONES[index % TILE_TONES.length],
          )}
        />
        <Bar className="h-3.5 w-1/2" />
      </div>
      <Bar className="h-3 w-full" />
      <Bar className="h-3 w-3/4" />
      <div className="mt-auto flex gap-space-sm border-t border-line-subtle pt-space-sm">
        <Bar className="h-3 w-12" />
        <Bar className="h-3 w-16" />
      </div>
    </div>
  )
}

/**
 * The first load of a collection, shaped like what will arrive: cards for the
 * grid view, rows for the list view, with the coloured identity tiles in
 * place. It fills the body from the top (not a centred spinner card) and is
 * announced once as a polite status. Later page changes keep the current
 * page on screen instead (keepPreviousData) and show CollectionTemplate's
 * thin refresh bar.
 */
export function CollectionSkeleton({
  view = 'grid',
  count,
  label,
  className,
}: {
  view?: 'grid' | 'list'
  count?: number
  /** What is loading, for screen readers; defaults to "Loading". */
  label?: string
  className?: string
}) {
  const { t } = useTranslation()
  const items = Array.from(
    { length: count ?? (view === 'grid' ? 6 : 8) },
    (_, index) => index,
  )
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-slot="collection-skeleton"
      data-view={view}
      className={cn('w-full flex-1 self-stretch', className)}
    >
      <span className="sr-only">{label ?? t('common.loading')}</span>
      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-space-md p-space-md sm:grid-cols-2 xl:grid-cols-3">
          {items.map((index) => (
            <ResourceCardSkeleton key={index} index={index} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-space-2xs p-space-sm">
          {items.map((index) => (
            <ResourceListSkeletonRow key={index} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}
