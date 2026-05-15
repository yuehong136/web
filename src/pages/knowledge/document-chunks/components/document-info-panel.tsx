import type { ReactNode } from 'react'
import {
  ChevronDown,
  ChevronRight,
  FileText,
  PanelRightClose,
  Tag,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Card, Tooltip } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { formatChunkFileSize } from '../utils'
import type { ChunkData, ChunkListDocument } from '../types'
import { ParserConfigDetails } from './parser-config-details'

interface DocumentInfoPanelProps {
  docInfo: ChunkListDocument | null
  selectedChunk: ChunkData | null
  showParserConfig: boolean
  onShowParserConfigChange: (show: boolean) => void
  onCollapsePanel: () => void
  onClearSelectedChunk: () => void
  onStartMetaAnnotation: () => void
}

export const DocumentInfoPanel = ({
  docInfo,
  selectedChunk,
  showParserConfig,
  onShowParserConfigChange,
  onCollapsePanel,
  onClearSelectedChunk,
  onStartMetaAnnotation,
}: DocumentInfoPanelProps) => {
  const { t } = useTranslation()

  return (
    <>
      <div className="flex items-center justify-between border-b border-border-default bg-background-surface px-4 py-2">
        <span className="text-sm font-medium text-text-primary">
          {t('knowledge.chunks.info.title')}
        </span>
        <Tooltip content={t('knowledge.chunks.info.collapsePanel')}>
          <Button variant="ghost" size="sm" onClick={onCollapsePanel}>
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>

      {selectedChunk && (
        <div className="border-b border-border-default p-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-2 text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <FileText
                className="h-4 w-4"
                style={{ color: 'var(--color-text-accent)' }}
              />
              <span>{t('knowledge.chunks.info.selectedChunk')}</span>
              <span
                className={
                  selectedChunk.available_int === 1
                    ? 'bg-status-success-subtle text-status-success rounded px-1.5 py-0.5 text-xs'
                    : 'bg-status-error-subtle text-status-error rounded px-1.5 py-0.5 text-xs'
                }
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
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p
            className="mt-2 text-xs"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {t('knowledge.chunks.info.editHint')}
          </p>
        </div>
      )}

      <div className="h-full space-y-6 overflow-y-auto p-6 scrollbar-thin">
        <Card>
          <div className="p-4">
            <h3
              className="mb-4 text-lg font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {t('knowledge.chunks.info.metadataTitle')}
            </h3>
            <div className="space-y-4">
              <div
                className="text-sm leading-relaxed"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <p>{t('knowledge.chunks.info.metadataDescription')}</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={onStartMetaAnnotation}
              >
                <Tag className="mr-2 h-4 w-4" />
                {t('knowledge.chunks.info.startAnnotation')}
              </Button>
            </div>
          </div>
        </Card>

        {docInfo && (
          <Card>
            <div className="p-4">
              <h3
                className="mb-4 text-lg font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {t('knowledge.chunks.info.documentInfo')}
              </h3>
              <div className="space-y-4">
                <MetadataSummary docInfo={docInfo} />
                <FileSummary docInfo={docInfo} />
                <TechnicalSummary
                  docInfo={docInfo}
                  showParserConfig={showParserConfig}
                  onShowParserConfigChange={onShowParserConfigChange}
                />
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  )
}

const MetadataSummary = ({ docInfo }: { docInfo: ChunkListDocument }) => {
  const { t } = useTranslation()
  const metaFields = docInfo.meta_fields || {}

  return (
    <div>
      <SectionTitle>{t('knowledge.chunks.info.metadataInfo')}</SectionTitle>
      <div
        className="rounded-lg p-3"
        style={{ backgroundColor: 'var(--color-background-subtle)' }}
      >
        {Object.keys(metaFields).length > 0 ? (
          <div className="space-y-1 text-xs">
            {Object.entries(metaFields).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {key}:
                </span>
                <span style={{ color: 'var(--color-text-primary)' }}>
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span
            className="text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {t('knowledge.chunks.info.noMetadata')}
          </span>
        )}
      </div>
    </div>
  )
}

const FileSummary = ({ docInfo }: { docInfo: ChunkListDocument }) => {
  const { t } = useTranslation()

  return (
    <div>
      <SectionTitle>{t('knowledge.chunks.info.fileInfo')}</SectionTitle>
      <div className="space-y-2 text-xs">
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
      </div>
    </div>
  )
}

interface TechnicalSummaryProps {
  docInfo: ChunkListDocument
  showParserConfig: boolean
  onShowParserConfigChange: (show: boolean) => void
}

const TechnicalSummary = ({
  docInfo,
  showParserConfig,
  onShowParserConfigChange,
}: TechnicalSummaryProps) => {
  const { t } = useTranslation()

  return (
    <div>
      <SectionTitle>{t('knowledge.chunks.info.technicalParams')}</SectionTitle>
      <div className="space-y-2 text-xs">
        <InfoRow
          label={t('knowledge.chunks.info.chunkMethod')}
          value={docInfo.parser_id}
        />
        <div className="flex items-center justify-between">
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {t('knowledge.chunks.info.parserConfig')}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShowParserConfigChange(!showParserConfig)}
            className="flex h-6 items-center gap-1 px-2 text-xs"
            style={{ color: 'var(--color-text-accent)' }}
          >
            {showParserConfig ? (
              <>
                <ChevronDown className="h-3 w-3" />
                {t('knowledge.chunks.info.collapse')}
              </>
            ) : (
              <>
                <ChevronRight className="h-3 w-3" />
                {t('knowledge.chunks.info.expand')}
              </>
            )}
          </Button>
        </div>

        {showParserConfig && docInfo.parser_config && (
          <ParserConfigDetails parserConfig={docInfo.parser_config} />
        )}
      </div>
    </div>
  )
}

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h4
    className="mb-2 text-sm font-medium"
    style={{ color: 'var(--color-text-primary)' }}
  >
    {children}
  </h4>
)

interface InfoRowProps {
  label: string
  value: ReactNode
}

const InfoRow = ({ label, value }: InfoRowProps) => (
  <div className="flex justify-between">
    <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
    <span
      className="ml-2 break-all text-right font-medium"
      style={{ color: 'var(--color-text-primary)' }}
    >
      {value}
    </span>
  </div>
)
