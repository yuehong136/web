import type { ReactNode } from 'react'
import { FileText, Tag, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { FileKindTile } from '@/components/patterns/file-kind-tile'
import { cn, formatDate } from '@/lib/utils'
import { useDocumentParserLabel } from '../../documents/parser-method-cell'
import { formatChunkFileSize } from '../utils'
import type { ChunkData, ChunkListDocument } from '../types'
import { ParserConfigDetails } from './parser-config-details'

interface DocumentInfoPanelProps {
  docInfo: ChunkListDocument | null
  selectedChunk: ChunkData | null
  onClearSelectedChunk: () => void
  onStartMetaAnnotation: () => void
  disabled?: boolean
}

/** "Document information" tab: the selected chunk, metadata and the file. */
export const DocumentInfoPanel = ({
  docInfo,
  selectedChunk,
  onClearSelectedChunk,
  onStartMetaAnnotation,
  disabled = false,
}: DocumentInfoPanelProps) => {
  const { t } = useTranslation()

  return (
    <PanelBody>
      {selectedChunk && (
        <section className="rounded-radius-lg border border-line-subtle bg-surface p-space-sm">
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex min-w-0 items-center gap-space-sm text-sm text-fg-muted">
              <FileText className="size-icon-sm shrink-0" aria-hidden="true" />
              <span>{t('knowledge.chunks.info.selectedChunk')}</span>
              <span
                className={cn(
                  'shrink-0 rounded-radius-full px-space-sm py-space-2xs text-xs',
                  selectedChunk.available_int === 1
                    ? 'bg-success-soft text-success-fg'
                    : 'bg-sunken text-fg-muted',
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
              <X className="size-icon-sm" aria-hidden="true" />
            </Button>
          </div>
          <p className="mt-space-xs font-mono text-xs break-all text-fg-subtle">
            {selectedChunk.chunk_id}
          </p>
        </section>
      )}

      <section>
        <div className="mb-space-xs flex items-center justify-between gap-space-base">
          <SectionTitle>
            {t('knowledge.chunks.info.metadataTitle')}
          </SectionTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onStartMetaAnnotation}
            disabled={disabled || !docInfo}
          >
            <Tag className="size-icon-sm" aria-hidden="true" />
            {t('common.edit')}
          </Button>
        </div>
        <MetadataSummary docInfo={docInfo} />
      </section>

      {docInfo ? <FileSummary docInfo={docInfo} /> : null}
    </PanelBody>
  )
}

/** "Parser configuration" tab: the chunk method and its settings. */
export const DocumentParserPanel = ({
  docInfo,
}: {
  docInfo: ChunkListDocument | null
}) => {
  const { t } = useTranslation()
  if (!docInfo) return <PanelBody>{null}</PanelBody>
  return (
    <PanelBody>
      <section>
        <SectionTitle>
          {t('knowledge.chunks.info.technicalParams')}
        </SectionTitle>
        <dl className="mt-space-xs divide-y divide-line-subtle">
          <InfoRow
            label={t('knowledge.chunks.info.chunkMethod')}
            value={<ParserLabel docInfo={docInfo} />}
          />
        </dl>
      </section>
      <section>
        <SectionTitle>{t('knowledge.chunks.info.parserConfig')}</SectionTitle>
        {docInfo.parser_config ? (
          <ParserConfigDetails parserConfig={docInfo.parser_config} />
        ) : (
          <p className="py-space-sm text-sm text-fg-subtle">—</p>
        )}
      </section>
    </PanelBody>
  )
}

const ParserLabel = ({ docInfo }: { docInfo: ChunkListDocument }) => (
  <>{useDocumentParserLabel(docInfo)}</>
)

const PanelBody = ({ children }: { children: ReactNode }) => (
  <div className="scrollbar-thin h-full min-h-0 scrollbar-thumb-line-strong scrollbar-track-transparent space-y-space-lg overflow-y-auto p-space-md">
    {children}
  </div>
)

const MetadataSummary = ({
  docInfo,
}: {
  docInfo: ChunkListDocument | null
}) => {
  const { t } = useTranslation()
  const metaFields = docInfo?.meta_fields || {}

  return Object.keys(metaFields).length > 0 ? (
    <dl className="divide-y divide-line-subtle">
      {Object.entries(metaFields).map(([key, value]) => (
        <InfoRow key={key} label={key} value={String(value)} />
      ))}
    </dl>
  ) : (
    <p className="py-space-sm text-sm text-fg-subtle">
      {t('knowledge.chunks.info.noMetadata')}
    </p>
  )
}

const FileSummary = ({ docInfo }: { docInfo: ChunkListDocument }) => {
  const { t } = useTranslation()

  return (
    <section className="border-t border-line-subtle pt-space-md">
      <div className="mb-space-xs flex items-center gap-space-sm">
        <FileKindTile name={docInfo.suffix || docInfo.name} size="sm" />
        <SectionTitle>{t('knowledge.chunks.info.fileInfo')}</SectionTitle>
      </div>
      <dl className="divide-y divide-line-subtle">
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

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h3 className="text-xs font-medium text-fg-subtle">{children}</h3>
)

interface InfoRowProps {
  label: string
  value: ReactNode
}

const InfoRow = ({ label, value }: InfoRowProps) => (
  <div className="grid grid-cols-3 gap-space-base py-space-sm text-sm">
    <dt className="break-words text-fg-subtle">{label}</dt>
    <dd className="col-span-2 min-w-0 text-right break-words text-fg">
      {value || '—'}
    </dd>
  </div>
)
