import { AppScene, PageEmptyState } from '@/components/patterns'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  createDisplayJson,
  getChunkMetadataEntries,
  getChunkOrder,
  getChunkPages,
  getChunkText,
  getChunkTitle,
  getChunkType,
  getChunkVectorDimensions,
  getChunkVectorFields,
  type PipelineOutputChunk,
  PipelineResultChunkType,
  PipelineResultView,
} from './pipeline-result-utils'
import { Braces, FileText, ImageIcon, Table2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Translate = (key: string, options?: Record<string, unknown>) => string

interface ResultMetricProps {
  label: string
  value: string
}

export function ResultMetric({ label, value }: ResultMetricProps) {
  return (
    <div className="bg-surface-secondary flex items-center justify-between gap-space-sm rounded-radius-md px-space-sm py-space-xs">
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  )
}

interface ResultStatCardProps {
  label: string
  value: string
  icon: LucideIcon
}

export function ResultStatCard({
  label,
  value,
  icon: Icon,
}: ResultStatCardProps) {
  return (
    <div className="bg-surface-secondary rounded-radius-lg border border-border-subtle px-space-base py-space-sm">
      <div className="flex items-center justify-between gap-space-sm">
        <span className="min-w-0 truncate text-xs font-medium text-text-tertiary">
          {label}
        </span>
        <Icon className="size-4 text-text-tertiary" />
      </div>
      <p className="mt-space-xs text-xl font-semibold text-text-primary tabular-nums">
        {value}
      </p>
    </div>
  )
}

interface MetadataChipProps {
  label: string
  value: string
  fullValue?: string
}

export function MetadataChip({ label, value, fullValue }: MetadataChipProps) {
  return (
    <div className="bg-surface-primary min-w-0 rounded-radius-md border border-border-subtle px-space-sm py-space-xs">
      <dt className="text-xs text-text-tertiary">{label}</dt>
      <dd
        className="mt-space-2xs truncate text-sm font-medium text-text-primary"
        title={fullValue || value}
      >
        {value}
      </dd>
    </div>
  )
}

interface ResultViewSwitchProps {
  value: PipelineResultView
  onChange: (value: PipelineResultView) => void
  t: Translate
}

export function ResultViewSwitch({
  value,
  onChange,
  t,
}: ResultViewSwitchProps) {
  return (
    <div
      className="bg-surface-secondary inline-flex gap-space-2xs rounded-radius-md border border-border-subtle p-space-2xs"
      aria-label={t('flow.pipelineResult.viewModeLabel')}
    >
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-pressed={value === PipelineResultView.Chunks}
        className={cn(
          'h-8 px-space-sm',
          value === PipelineResultView.Chunks &&
            'bg-components-console-surface text-text-primary shadow-xs',
        )}
        onClick={() => onChange(PipelineResultView.Chunks)}
      >
        <FileText className="size-4" />
        {t('flow.pipelineResult.chunksTab')}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-pressed={value === PipelineResultView.Json}
        className={cn(
          'h-8 px-space-sm',
          value === PipelineResultView.Json &&
            'bg-components-console-surface text-text-primary shadow-xs',
        )}
        onClick={() => onChange(PipelineResultView.Json)}
      >
        <Braces className="size-4" />
        {t('flow.pipelineResult.jsonTab')}
      </Button>
    </div>
  )
}

interface ChunkCardProps {
  chunk: PipelineOutputChunk
  index: number
  selected: boolean
  onSelect: () => void
  t: Translate
  formatNumber: Intl.NumberFormat
}

export function ChunkCard({
  chunk,
  index,
  selected,
  onSelect,
  t,
  formatNumber,
}: ChunkCardProps) {
  const chunkType = getChunkType(chunk)
  const text = getChunkText(chunk)
  const title = getChunkTitle(chunk)
  const vectorDimensions = getChunkVectorDimensions(chunk)
  const pages = getChunkPages(chunk)
  const order = getChunkOrder(chunk, index)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-radius-lg border p-space-base text-left transition-colors',
        selected
          ? 'bg-surface-secondary border-components-button-primary-bg'
          : 'bg-surface-primary hover:bg-surface-secondary border-border-subtle hover:border-border-default',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex min-w-0 items-center gap-space-sm">
          <ChunkTypeIcon type={chunkType} />
          <Badge variant={getTypeBadgeVariant(chunkType)}>
            {getTypeLabel(chunkType, t)}
          </Badge>
          <span className="text-xs text-text-tertiary">
            {t('flow.pipelineResult.chunkOrder', { order })}
          </span>
        </div>
        <span className="text-xs text-text-tertiary">
          {t('flow.pipelineResult.textLength', {
            value: formatNumber.format(text.length),
          })}
        </span>
      </div>

      {title ? (
        <p className="mt-space-sm truncate text-sm font-semibold text-text-primary">
          {title}
        </p>
      ) : null}

      <p className="mt-space-sm line-clamp-3 text-sm leading-relaxed break-words whitespace-pre-wrap text-text-secondary">
        {text || t('flow.pipelineResult.emptyChunkText')}
      </p>

      <div className="mt-space-sm flex flex-wrap gap-space-xs">
        {pages.length > 0 ? (
          <Badge variant="outline">
            {t('flow.pipelineResult.pagesBadge', {
              pages: pages.join(', '),
            })}
          </Badge>
        ) : null}
        {vectorDimensions ? (
          <Badge variant="blue">
            {t('flow.pipelineResult.vectorBadge', {
              dimensions: formatNumber.format(vectorDimensions),
            })}
          </Badge>
        ) : null}
        {typeof chunk.img_id === 'string' && chunk.img_id ? (
          <Badge variant="purple">{t('flow.pipelineResult.imageBadge')}</Badge>
        ) : null}
      </div>
    </button>
  )
}

interface ChunkDetailProps {
  chunk: PipelineOutputChunk | undefined
  index: number
  t: Translate
  formatNumber: Intl.NumberFormat
}

export function ChunkDetail({
  chunk,
  index,
  t,
  formatNumber,
}: ChunkDetailProps) {
  if (!chunk) {
    return (
      <aside className="min-w-0 border-t border-border-subtle pt-space-base xl:border-t-0 xl:border-l xl:pt-0 xl:pl-space-base">
        <h4 className="mb-space-sm text-base font-semibold text-text-primary">
          {t('flow.pipelineResult.detailTitle')}
        </h4>
        <PageEmptyState
          scene={AppScene.CONSOLE}
          compact
          title={t('flow.pipelineResult.noSelectionTitle')}
          description={t('flow.pipelineResult.noSelectionDescription')}
        />
      </aside>
    )
  }

  const chunkType = getChunkType(chunk)
  const order = getChunkOrder(chunk, index)
  const text = getChunkText(chunk)
  const metadata = getChunkMetadataEntries(chunk)
  const vectorFields = getChunkVectorFields(chunk)
  const displayChunkJson = JSON.stringify(createDisplayJson(chunk), null, 2)

  return (
    <aside className="min-w-0 border-t border-border-subtle pt-space-base xl:border-t-0 xl:border-l xl:pt-0 xl:pl-space-base">
      <div className="space-y-space-base">
        <h4 className="text-base font-semibold text-text-primary">
          {t('flow.pipelineResult.detailTitle')}
        </h4>
        <div className="flex flex-wrap items-center gap-space-sm">
          <Badge variant={getTypeBadgeVariant(chunkType)}>
            {getTypeLabel(chunkType, t)}
          </Badge>
          <Badge variant="outline">
            {t('flow.pipelineResult.chunkOrder', { order })}
          </Badge>
        </div>

        <div className="bg-surface-secondary rounded-radius-md p-space-sm">
          <p className="text-xs font-medium text-text-tertiary uppercase">
            {t('flow.pipelineResult.chunkTextLabel')}
          </p>
          <p className="mt-space-sm max-h-[260px] overflow-auto text-sm leading-relaxed break-words whitespace-pre-wrap text-text-primary">
            {text || t('flow.pipelineResult.emptyChunkText')}
          </p>
        </div>

        {vectorFields.length > 0 ? (
          <div className="bg-surface-secondary rounded-radius-md p-space-sm">
            <p className="text-xs font-medium text-text-tertiary uppercase">
              {t('flow.pipelineResult.vectorSummaryLabel')}
            </p>
            <div className="mt-space-sm space-y-space-xs">
              {vectorFields.map((fieldName) => {
                const value = chunk[fieldName]
                const dimensions = Array.isArray(value) ? value.length : 0
                return (
                  <ResultMetric
                    key={fieldName}
                    label={fieldName}
                    value={t('flow.pipelineResult.vectorDimensions', {
                      dimensions: formatNumber.format(dimensions),
                    })}
                  />
                )
              })}
            </div>
          </div>
        ) : null}

        {metadata.length > 0 ? (
          <div className="bg-surface-secondary rounded-radius-md p-space-sm">
            <p className="text-xs font-medium text-text-tertiary uppercase">
              {t('flow.pipelineResult.metadataTitle')}
            </p>
            <dl className="mt-space-sm space-y-space-xs">
              {metadata.map(({ key, value }) => (
                <div key={key} className="space-y-space-2xs">
                  <dt className="text-xs text-text-tertiary">{key}</dt>
                  <dd className="text-xs break-all text-text-primary">
                    {formatMetadataValue(value, t)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}

        <div className="bg-surface-secondary rounded-radius-md p-space-sm">
          <p className="text-xs font-medium text-text-tertiary uppercase">
            {t('flow.pipelineResult.rawChunkLabel')}
          </p>
          <pre className="mt-space-sm max-h-[280px] overflow-auto font-mono text-xs leading-relaxed text-text-primary">
            {displayChunkJson}
          </pre>
        </div>
      </div>
    </aside>
  )
}

export function getTypeLabel(
  type: PipelineResultChunkType,
  t: Translate,
): string {
  const labelKeyByType = {
    [PipelineResultChunkType.All]: 'flow.pipelineResult.types.all',
    [PipelineResultChunkType.Text]: 'flow.pipelineResult.types.text',
    [PipelineResultChunkType.Table]: 'flow.pipelineResult.types.table',
    [PipelineResultChunkType.Image]: 'flow.pipelineResult.types.image',
    [PipelineResultChunkType.Other]: 'flow.pipelineResult.types.other',
  }
  return t(labelKeyByType[type])
}

function ChunkTypeIcon({ type }: { type: PipelineResultChunkType }) {
  const className = 'size-4 shrink-0 text-text-tertiary'
  if (type === PipelineResultChunkType.Image) {
    return <ImageIcon className={className} />
  }
  if (type === PipelineResultChunkType.Table) {
    return <Table2 className={className} />
  }
  if (type === PipelineResultChunkType.Other) {
    return <Braces className={className} />
  }
  return <FileText className={className} />
}

function getTypeBadgeVariant(
  type: PipelineResultChunkType,
): BadgeProps['variant'] {
  if (type === PipelineResultChunkType.Image) {
    return 'purple'
  }
  if (type === PipelineResultChunkType.Table) {
    return 'green'
  }
  if (type === PipelineResultChunkType.Other) {
    return 'orange'
  }
  return 'blue'
}

function formatMetadataValue(value: unknown, t: Translate): string {
  if (typeof value === 'string') {
    return value || t('flow.pipelineResult.emptyValue')
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value === null || value === undefined) {
    return t('flow.pipelineResult.emptyValue')
  }
  return JSON.stringify(value)
}
