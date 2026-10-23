import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Grid2X2,
  List,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type AssetTimeFormat = 'detailed' | 'compact' | 'relative'
export interface AssetListControlLabels {
  view: string
  grid: string
  list: string
  timeFormat: string
  detailed: string
  compact: string
  relative: string
  newest: string
  oldest: string
}
/** Controlled list preferences, shared by asset workspaces without owning their state. */
export function AssetListControls({
  view,
  onViewChange,
  timeFormat,
  onTimeFormatChange,
  sortDescending,
  onToggleSort,
  labels,
  className,
}: {
  view: 'grid' | 'list'
  onViewChange: (view: 'grid' | 'list') => void
  timeFormat: AssetTimeFormat
  onTimeFormatChange: (format: AssetTimeFormat) => void
  sortDescending: boolean
  onToggleSort: () => void
  labels: AssetListControlLabels
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-space-sm', className)}>
      <Select
        value={timeFormat}
        onValueChange={(value) => onTimeFormatChange(value as AssetTimeFormat)}
      >
        <SelectTrigger
          aria-label={labels.timeFormat}
          className="h-auto min-h-[var(--control-height-sm)] w-auto min-w-36 text-sm"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="detailed">{labels.detailed}</SelectItem>
          <SelectItem value="compact">{labels.compact}</SelectItem>
          <SelectItem value="relative">{labels.relative}</SelectItem>
        </SelectContent>
      </Select>
      <Button type="button" variant="outline" size="sm" onClick={onToggleSort}>
        {sortDescending ? (
          <ArrowDownWideNarrow className="size-icon-sm" aria-hidden="true" />
        ) : (
          <ArrowUpNarrowWide className="size-icon-sm" aria-hidden="true" />
        )}
        {sortDescending ? labels.newest : labels.oldest}
      </Button>
      <fieldset
        aria-label={labels.view}
        className="inline-flex gap-space-2xs rounded-radius-lg border border-border-default bg-background-subtle p-space-2xs"
      >
        <Button
          type="button"
          variant={view === 'grid' ? 'secondary' : 'ghost'}
          size="icon-sm"
          aria-label={labels.grid}
          title={labels.grid}
          aria-pressed={view === 'grid'}
          onClick={() => onViewChange('grid')}
        >
          <Grid2X2 className="size-icon-sm" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant={view === 'list' ? 'secondary' : 'ghost'}
          size="icon-sm"
          aria-label={labels.list}
          title={labels.list}
          aria-pressed={view === 'list'}
          onClick={() => onViewChange('list')}
        >
          <List className="size-icon-sm" aria-hidden="true" />
        </Button>
      </fieldset>
    </div>
  )
}
