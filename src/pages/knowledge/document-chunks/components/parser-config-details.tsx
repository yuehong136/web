import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface ParserConfigDetailsProps {
  parserConfig: Record<string, any>
}

export const ParserConfigDetails = ({
  parserConfig,
}: ParserConfigDetailsProps) => {
  const { t } = useTranslation()

  return (
    <div className="mt-2 space-y-3 rounded-lg border border-border-default bg-background-subtle p-3">
      <div className="space-y-2">
        {parserConfig.layout_recognize && (
          <ConfigRow
            label={t('knowledge.chunks.info.layoutRecognize')}
            value={
              <span className="rounded bg-components-badge-info-bg px-2 py-0.5 text-xs text-components-badge-info-text">
                {parserConfig.layout_recognize}
              </span>
            }
          />
        )}
        {parserConfig.chunk_token_num !== undefined && (
          <ConfigRow
            label={t('knowledge.chunks.info.chunkSize')}
            value={`${parserConfig.chunk_token_num} tokens`}
          />
        )}
        {parserConfig.delimiter !== undefined && (
          <ConfigRow
            label={t('knowledge.chunks.info.delimiter')}
            value={
              <code className="rounded bg-background-subtle px-1.5 py-0.5 text-xs text-text-secondary">
                {parserConfig.delimiter === '\n'
                  ? '\\n'
                  : parserConfig.delimiter}
              </code>
            }
          />
        )}
        {parserConfig.topn_tags !== undefined && (
          <ConfigRow
            label={t('knowledge.chunks.info.tagCount')}
            value={parserConfig.topn_tags}
          />
        )}
        {parserConfig.auto_keywords !== undefined && (
          <ConfigRow
            label={t('knowledge.chunks.info.autoKeywords')}
            value={parserConfig.auto_keywords}
          />
        )}
        {parserConfig.auto_questions !== undefined && (
          <ConfigRow
            label={t('knowledge.chunks.info.autoQuestions')}
            value={parserConfig.auto_questions}
          />
        )}
        {parserConfig.html4excel && (
          <ConfigRow
            label={t('knowledge.chunks.info.htmlToExcel')}
            value={<EnabledBadge />}
          />
        )}
        {parserConfig.toc_extraction && (
          <ConfigRow
            label={t('knowledge.chunks.info.tocExtraction')}
            value={<EnabledBadge />}
          />
        )}
      </div>

      {parserConfig.raptor?.use_raptor && (
        <ConfigSection
          dotClassName="bg-components-badge-blue-bg"
          title={t('knowledge.chunks.info.raptorEnhancement')}
        >
          {parserConfig.raptor.scope !== undefined && (
            <NestedConfigRow
              label={t('knowledge.chunks.info.scope')}
              value={
                parserConfig.raptor.scope === 'file'
                  ? t('knowledge.chunks.info.singleFile')
                  : t('knowledge.chunks.info.global')
              }
            />
          )}
          {parserConfig.raptor.max_token !== undefined && (
            <NestedConfigRow
              label={t('knowledge.chunks.info.maxToken')}
              value={parserConfig.raptor.max_token}
            />
          )}
          {parserConfig.raptor.threshold !== undefined && (
            <NestedConfigRow
              label={t('knowledge.chunks.info.threshold')}
              value={parserConfig.raptor.threshold}
            />
          )}
          {parserConfig.raptor.max_cluster !== undefined && (
            <NestedConfigRow
              label={t('knowledge.chunks.info.maxCluster')}
              value={parserConfig.raptor.max_cluster}
            />
          )}
          {parserConfig.raptor.random_seed !== undefined && (
            <NestedConfigRow
              label={t('knowledge.chunks.info.randomSeed')}
              value={parserConfig.raptor.random_seed}
            />
          )}
          {parserConfig.raptor.prompt && (
            <div className="flex flex-col gap-1">
              <NestedLabel>{t('knowledge.chunks.info.prompt')}</NestedLabel>
              <div className="max-h-20 overflow-y-auto whitespace-pre-wrap break-words rounded bg-background-subtle p-2 text-xs text-text-secondary scrollbar-thin">
                {parserConfig.raptor.prompt}
              </div>
            </div>
          )}
        </ConfigSection>
      )}

      {parserConfig.graphrag?.use_graphrag && (
        <ConfigSection
          dotClassName="bg-components-badge-warning-bg"
          title={t('knowledge.chunks.info.graphRagEnhancement')}
        >
          {parserConfig.graphrag.method !== undefined && (
            <NestedConfigRow
              label={t('knowledge.chunks.info.method')}
              value={
                parserConfig.graphrag.method === 'light'
                  ? t('knowledge.chunks.info.light')
                  : t('knowledge.chunks.info.standard')
              }
            />
          )}
          {parserConfig.graphrag.resolution && (
            <NestedConfigRow
              label={t('knowledge.chunks.info.entityResolution')}
              value={<EnabledBadge />}
            />
          )}
          {parserConfig.graphrag.community && (
            <NestedConfigRow
              label={t('knowledge.chunks.info.communityReport')}
              value={<EnabledBadge />}
            />
          )}
          {parserConfig.graphrag.entity_types?.length > 0 && (
            <div className="flex flex-col gap-1">
              <NestedLabel>
                {t('knowledge.chunks.info.entityTypes')}
              </NestedLabel>
              <div className="flex flex-wrap gap-1">
                {parserConfig.graphrag.entity_types.map(
                  (type: string, index: number) => (
                    <span
                      key={`${type}-${index}`}
                      className="rounded bg-background-subtle px-1.5 py-0.5 text-xs text-text-secondary"
                    >
                      {type}
                    </span>
                  ),
                )}
              </div>
            </div>
          )}
        </ConfigSection>
      )}
    </div>
  )
}

interface RowProps {
  label: string
  value: ReactNode
}

const ConfigRow = ({ label, value }: RowProps) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-text-secondary">{label}</span>
    {typeof value === 'string' || typeof value === 'number' ? (
      <span className="text-xs font-medium text-text-primary">{value}</span>
    ) : (
      value
    )}
  </div>
)

const NestedConfigRow = ({ label, value }: RowProps) => (
  <div className="flex justify-between">
    <NestedLabel>{label}</NestedLabel>
    {typeof value === 'string' || typeof value === 'number' ? (
      <span className="text-xs text-text-secondary">{value}</span>
    ) : (
      value
    )}
  </div>
)

interface ConfigSectionProps {
  dotClassName: string
  title: string
  children: ReactNode
}

const ConfigSection = ({
  dotClassName,
  title,
  children,
}: ConfigSectionProps) => (
  <div className="border-t border-border-subtle pt-2">
    <div className="mb-2 flex items-center gap-1.5">
      <div className={cn('h-1.5 w-1.5 rounded-full', dotClassName)} />
      <span className="text-xs font-medium text-text-primary">{title}</span>
    </div>
    <div className="space-y-1.5 pl-3">{children}</div>
  </div>
)

const NestedLabel = ({ children }: { children: ReactNode }) => (
  <span className="text-xs text-text-muted">{children}</span>
)

const EnabledBadge = () => {
  const { t } = useTranslation()
  return (
    <span className="rounded bg-components-badge-success-bg px-1.5 py-0.5 text-xs text-components-badge-success-text">
      {t('knowledge.chunks.info.enabled')}
    </span>
  )
}
