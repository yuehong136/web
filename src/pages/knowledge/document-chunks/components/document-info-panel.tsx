import { useId, useState, type ReactNode } from 'react'
import { ChevronDown, FileText, Tag, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { cn, formatDate } from '@/lib/utils'
import { formatChunkFileSize } from '../utils'
import type { ChunkData, ChunkListDocument } from '../types'
import { ParserConfigDetails } from './parser-config-details'

interface DocumentInfoPanelProps {
  docInfo: ChunkListDocument | null
  selectedChunk: ChunkData | null
  onCollapsePanel: () => void
  onClearSelectedChunk: () => void
  onStartMetaAnnotation: () => void
  disabled?: boolean
}

export const DocumentInfoPanel = ({
  docInfo,
  selectedChunk,
  onCollapsePanel,
  onClearSelectedChunk,
  onStartMetaAnnotation,
  disabled = false,
}: DocumentInfoPanelProps) => {
  const { t } = useTranslation()
  const [showParserConfig, setShowParserConfig] = useState(false)
  const parserConfigId = useId()

  return (
    <div className="flex h-full min-h-0 flex-col bg-background-surface">
      <div className="flex shrink-0 items-center justify-between gap-space-base border-b border-border-default px-space-lg py-space-base">
        <h2 className="text-base font-semibold text-text-primary">
          {t('knowledge.chunks.info.title')}
        </h2>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onCollapsePanel}
          aria-label={t('common.close')}
        >
          <X className="size-icon-sm" />
        </Button>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 scrollbar-thumb-components-scrollbar-thumb scrollbar-track-transparent space-y-space-lg overflow-y-auto p-space-lg">
        {selectedChunk && (
          <section className="rounded-radius-lg border border-border-subtle p-space-base">
            <div className="flex items-center justify-between gap-space-sm">
              <div className="flex min-w-0 items-center gap-space-sm text-sm text-text-secondary">
                <FileText className="size-icon-sm shrink-0" />
                <span>{t('knowledge.chunks.info.selectedChunk')}</span>
                <span
                  className={cn(
                    'shrink-0 rounded-radius-full px-space-sm py-space-2xs text-xs',
                    selectedChunk.available_int === 1
                      ? 'bg-status-success/10 text-status-success'
                      : 'bg-background-subtle text-text-secondary',
                  )}
                >
                  {selectedChunk.available_int === 1
                    ? t('knowledge.chunks.list.statusEnabled')
                    : t('knowledge.chunks.list.statusDisabled')}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClearSelectedChunk}
                aria-label={t('common.clear')}
              >
                <X className="size-icon-sm" />
              </Button>
            </div>
            <p className="mt-space-sm font-mono text-xs break-all text-text-tertiary">
              {selectedChunk.chunk_id}
            </p>
          </section>
        )}

        <section>
          <div className="mb-space-sm flex items-center justify-between gap-space-base">
            <SectionTitle>
              {t('knowledge.chunks.info.metadataTitle')}
            </SectionTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onStartMetaAnnotation}
              disabled={disabled || !docInfo}
            >
              <Tag className="size-icon-sm" />
              {t('common.edit')}
            </Button>
          </div>
          <MetadataSummary docInfo={docInfo} />
        </section>

        {docInfo && (
          <>
            <FileSummary docInfo={docInfo} />
            <TechnicalSummary
              docInfo={docInfo}
              showParserConfig={showParserConfig}
              onShowParserConfigChange={setShowParserConfig}
              parserConfigId={parserConfigId}
            />
          </>
        )}
      </div>
    </div>
  )
}

const MetadataSummary = ({
  docInfo,
}: {
  docInfo: ChunkListDocument | null
}) => {
  const { t } = useTranslation()
  const metaFields = docInfo?.meta_fields || {}

  return Object.keys(metaFields).length > 0 ? (
    <dl className="divide-y divide-border-subtle">
      {Object.entries(metaFields).map(([key, value]) => (
        <InfoRow key={key} label={key} value={String(value)} />
      ))}
    </dl>
  ) : (
    <p className="py-space-sm text-sm text-text-tertiary">
      {t('knowledge.chunks.info.noMetadata')}
    </p>
  )
}

const FileSummary = ({ docInfo }: { docInfo: ChunkListDocument }) => {
  const { t } = useTranslation()

  return (
    <section className="border-t border-border-subtle pt-space-lg">
      <SectionTitle>{t('knowledge.chunks.info.fileInfo')}</SectionTitle>
      <dl className="mt-space-sm divide-y divide-border-subtle">
        <InfoRow
          label={t('knowledge.chunks.info.fileName')}
          value={docInfo.name}
        />
        <InfoRow
          label={t('knowledge.chunks.info.createTime')}
          value={formatDate(docInfo.create_date)}
        />
        <InfoRow
          label={t('knowledge.chunks.info.updateTime')}
          value={formatDate(docInfo.update_date)}
        />
        <InfoRow
          label={t('knowledge.chunks.info.fileSize')}
          value={formatChunkFileSize(docInfo.size)}
        />
        <InfoRow
          label={t('knowledge.chunks.info.source')}
          value={docInfo.source_type}
        />
      </dl>
    </section>
  )
}

interface TechnicalSummaryProps {
  docInfo: ChunkListDocument
  showParserConfig: boolean
  onShowParserConfigChange: (show: boolean) => void
  parserConfigId: string
}

const TechnicalSummary = ({
  docInfo,
  showParserConfig,
  onShowParserConfigChange,
  parserConfigId,
}: TechnicalSummaryProps) => {
  const { t } = useTranslation()

  return (
    <section className="border-t border-border-subtle pt-space-lg">
      <SectionTitle>{t('knowledge.chunks.info.technicalParams')}</SectionTitle>
      <dl className="mt-space-sm">
        <InfoRow
          label={t('knowledge.chunks.info.chunkMethod')}
          value={docInfo.parser_id}
        />
      </dl>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onShowParserConfigChange(!showParserConfig)}
        className="mt-space-sm w-full justify-between px-space-sm text-text-secondary"
        aria-expanded={showParserConfig}
        aria-controls={parserConfigId}
      >
        {t('knowledge.chunks.info.parserConfig')}
        <ChevronDown
          className={cn(
            'size-icon-sm transition-transform',
            showParserConfig && 'rotate-180',
          )}
        />
      </Button>
      <div id={parserConfigId} hidden={!showParserConfig}>
        {docInfo.parser_config && (
          <ParserConfigDetails parserConfig={docInfo.parser_config} />
        )}
      </div>
    </section>
  )
}

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h3 className="text-sm font-semibold text-text-primary">{children}</h3>
)

interface InfoRowProps {
  label: string
  value: ReactNode
}

const InfoRow = ({ label, value }: InfoRowProps) => (
  <div className="grid grid-cols-3 gap-space-base py-space-sm text-sm">
    <dt className="break-words text-text-tertiary">{label}</dt>
    <dd className="col-span-2 min-w-0 text-right break-words text-text-primary">
      {value || '—'}
    </dd>
  </div>
)
