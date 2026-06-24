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
    <div className="gap-space-sm rounded-radius-md bg-surface-secondary px-space-sm py-space-xs flex items-center justify-between">
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
    <div className="rounded-radius-lg bg-surface-secondary px-space-base py-space-sm border border-border-subtle">
      <div className="gap-space-sm flex items-center justify-between">
        <span className="min-w-0 truncate text-xs font-medium text-text-tertiary">
          {label}
        </span>
        <Icon className="size-4 text-text-tertiary" />
      </div>
      <p className="mt-space-xs text-xl font-semibold tabular-nums text-text-primary">
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
    <div className="rounded-radius-md bg-surface-primary px-space-sm py-space-xs min-w-0 border border-border-subtle">
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
      className="gap-space-2xs rounded-radius-md bg-surface-secondary p-space-2xs inline-flex border border-border-subtle"
      aria-label={t('flow.pipelineResult.viewModeLabel')}
    >
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-pressed={value === PipelineResultView.Chunks}
        className={cn(
          'px-space-sm h-8',
          value === PipelineResultView.Chunks &&
            'bg-components-console-surface text-text-primary shadow-sm',
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
          'px-space-sm h-8',
          value === PipelineResultView.Json &&
            'bg-components-console-surface text-text-primary shadow-sm',
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
        'rounded-radius-lg p-space-base w-full border text-left transition-colors',
        selected
          ? 'bg-surface-secondary border-components-button-primary-bg'
          : 'bg-surface-primary hover:bg-surface-secondary border-border-subtle hover:border-border-default',
      )}
    >
      <div className="gap-space-sm flex flex-wrap items-center justify-between">
        <div className="gap-space-sm flex min-w-0 items-center">
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
            count: formatNumber.format(text.length),
          })}
        </span>
      </div>

      {title ? (
        <p className="mt-space-sm truncate text-sm font-semibold text-text-primary">
          {title}
        </p>
      ) : null}

      <p className="mt-space-sm line-clamp-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-text-secondary">
        {text || t('flow.pipelineResult.emptyChunkText')}
      </p>

      <div className="mt-space-sm gap-space-xs flex flex-wrap">
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
      <aside className="pt-space-base xl:pl-space-base min-w-0 border-t border-border-subtle xl:border-l xl:border-t-0 xl:pt-0">
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
    <aside className="pt-space-base xl:pl-space-base min-w-0 border-t border-border-subtle xl:border-l xl:border-t-0 xl:pt-0">
      <div className="space-y-space-base">
        <h4 className="text-base font-semibold text-text-primary">
          {t('flow.pipelineResult.detailTitle')}
        </h4>
        <div className="gap-space-sm flex flex-wrap items-center">
          <Badge variant={getTypeBadgeVariant(chunkType)}>
            {getTypeLabel(chunkType, t)}
          </Badge>
          <Badge variant="outline">
            {t('flow.pipelineResult.chunkOrder', { order })}
          </Badge>
        </div>

        <div className="rounded-radius-md bg-surface-secondary p-space-sm">
          <p className="text-xs font-medium uppercase text-text-tertiary">
            {t('flow.pipelineResult.chunkTextLabel')}
          </p>
          <p className="mt-space-sm max-h-[260px] overflow-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-text-primary">
            {text || t('flow.pipelineResult.emptyChunkText')}
          </p>
        </div>

        {vectorFields.length > 0 ? (
          <div className="rounded-radius-md bg-surface-secondary p-space-sm">
            <p className="text-xs font-medium uppercase text-text-tertiary">
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
          <div className="rounded-radius-md bg-surface-secondary p-space-sm">
            <p className="text-xs font-medium uppercase text-text-tertiary">
              {t('flow.pipelineResult.metadataTitle')}
            </p>
            <dl className="mt-space-sm space-y-space-xs">
              {metadata.map(({ key, value }) => (
                <div key={key} className="space-y-space-2xs">
                  <dt className="text-xs text-text-tertiary">{key}</dt>
                  <dd className="break-all text-xs text-text-primary">
                    {formatMetadataValue(value, t)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}

        <div className="rounded-radius-md bg-surface-secondary p-space-sm">
          <p className="text-xs font-medium uppercase text-text-tertiary">
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
