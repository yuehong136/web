import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ConsolePageTemplate } from '@/components/page-templates'
import {
  AppScene,
  PageEmptyState,
  PageErrorState,
  PageHeader,
  PageLoadingState,
  SectionCard,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { useFetchMessageTrace } from '@/hooks/use-agent-request'
import {
  downloadJsonFile,
  findPipelineEndOutput,
  isPipelineEndOutputEmpty,
} from './features/pipeline-workbench/utils'
import {
  ChunkCard,
  ChunkDetail,
  getTypeLabel,
  MetadataChip,
  ResultStatCard,
  ResultViewSwitch,
} from './pipeline-result-components'
import {
  buildPipelineResultSummary,
  createDisplayJson,
  filterPipelineChunks,
  getChunkOrder,
  normalizePipelineOutputChunks,
  type PipelineOutputChunk,
  PipelineResultChunkType,
  PipelineResultView,
} from './pipeline-result-utils'
import {
  AlignLeft,
  ArrowLeft,
  Braces,
  Database,
  Download,
  FileText,
  Hash,
  ImageIcon,
  Search,
  Table2,
} from 'lucide-react'

const typeFilterOptions = [
  PipelineResultChunkType.All,
  PipelineResultChunkType.Text,
  PipelineResultChunkType.Table,
  PipelineResultChunkType.Image,
  PipelineResultChunkType.Other,
]

export default function PipelineResultPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState(PipelineResultChunkType.All)
  const [activeView, setActiveView] = useState(PipelineResultView.Chunks)
  const [selectedChunk, setSelectedChunk] =
    useState<PipelineOutputChunk | null>(null)
  const messageId = searchParams.get('id') || ''
  const agentId = searchParams.get('agent_id') || ''
  const documentId = searchParams.get('doc_id') || ''
  const agentTitle =
    searchParams.get('agent_title') ||
    t('flow.pipelineResult.fallbackAgentTitle')
  const documentExtension = searchParams.get('extension') || ''
  const createdBy = searchParams.get('created_by') || ''
  const formatNumber = useMemo(() => new Intl.NumberFormat(), [])

  const traceQuery = useFetchMessageTrace(agentId, messageId)
  const output = useMemo(
    () => findPipelineEndOutput(traceQuery.data),
    [traceQuery.data],
  )
  const outputAvailable = useMemo(
    () => !isPipelineEndOutputEmpty(traceQuery.data),
    [traceQuery.data],
  )
  const chunks = useMemo(() => normalizePipelineOutputChunks(output), [output])
  const summary = useMemo(() => buildPipelineResultSummary(chunks), [chunks])
  const filteredChunks = useMemo(
    () => filterPipelineChunks(chunks, query, typeFilter),
    [chunks, query, typeFilter],
  )
  const activeChunk =
    selectedChunk && filteredChunks.includes(selectedChunk)
      ? selectedChunk
      : filteredChunks[0]
  const activeChunkIndex = activeChunk ? chunks.indexOf(activeChunk) : -1
  const displayJson = useMemo(() => {
    if (!outputAvailable) {
      return ''
    }
    return JSON.stringify(createDisplayJson(output), null, 2)
  }, [output, outputAvailable])

  const metadata = [
    {
      label: t('flow.pipelineResult.metadata.agent'),
      value: agentTitle,
      displayValue: agentTitle,
    },
    {
      label: t('flow.pipelineResult.metadata.agentId'),
      value: agentId,
      displayValue: compactIdentifier(agentId),
    },
    {
      label: t('flow.pipelineResult.metadata.messageId'),
      value: messageId,
      displayValue: compactIdentifier(messageId),
    },
    {
      label: t('flow.pipelineResult.metadata.documentId'),
      value: documentId,
      displayValue: compactIdentifier(documentId),
    },
    {
      label: t('flow.pipelineResult.metadata.extension'),
      value: documentExtension,
      displayValue: documentExtension,
    },
    {
      label: t('flow.pipelineResult.metadata.createdBy'),
      value: createdBy,
      displayValue: compactIdentifier(createdBy),
    },
  ].filter(({ value }) => Boolean(value))

  const statCards = [
    {
      label: t('flow.pipelineResult.stats.totalChunks'),
      value: formatNumber.format(summary.totalChunks),
      icon: Hash,
    },
    {
      label: t('flow.pipelineResult.stats.textChunks'),
      value: formatNumber.format(summary.textChunks),
      icon: FileText,
    },
    {
      label: t('flow.pipelineResult.stats.imageChunks'),
      value: formatNumber.format(summary.imageChunks),
      icon: ImageIcon,
    },
    {
      label: t('flow.pipelineResult.stats.tableChunks'),
      value: formatNumber.format(summary.tableChunks),
      icon: Table2,
    },
    {
      label: t('flow.pipelineResult.stats.textCharacters'),
      value: formatNumber.format(summary.totalTextCharacters),
      icon: AlignLeft,
    },
    {
      label: t('flow.pipelineResult.stats.vectorizedChunks'),
      value: formatNumber.format(summary.vectorizedChunks),
      icon: Database,
    },
  ]

  if (!agentId || !messageId) {
    return (
      <PageErrorState
        scene={AppScene.CONSOLE}
        title={t('flow.pipelineResult.missingTitle')}
        description={t('flow.pipelineResult.missingDescription')}
        onRetry={() => navigate('/agents')}
        retryLabel={t('flow.pipelineResult.backToAgents')}
      />
    )
  }

  return (
    <ConsolePageTemplate
      header={
        <PageHeader
          title={t('flow.pipelineResult.title')}
          description={t('flow.pipelineResult.description')}
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => navigate(`/agent/${agentId}`)}
              >
                <ArrowLeft className="mr-space-xs size-4" />
                {t('flow.pipelineResult.backPipeline')}
              </Button>
              <Button
                variant="outline"
                disabled={!outputAvailable}
                onClick={() =>
                  downloadJsonFile(
                    output,
                    `${agentTitle || t('flow.pipelineResult.downloadFileBaseName')}.json`,
                  )
                }
              >
                <Download className="mr-space-xs size-4" />
                {t('flow.pipelineResult.downloadJson')}
              </Button>
            </>
          }
        />
      }
    >
      {traceQuery.isLoading ? (
        <PageLoadingState
          scene={AppScene.CONSOLE}
          compact
          title={t('flow.pipelineResult.loadingTitle')}
          description={t('flow.pipelineResult.loadingDescription')}
        />
      ) : traceQuery.isError ? (
        <PageErrorState
          scene={AppScene.CONSOLE}
          compact
          title={t('flow.pipelineResult.loadFailedTitle')}
          description={t('flow.pipelineResult.loadFailedDescription')}
          retryLabel={t('flow.pipelineResult.retry')}
          onRetry={() => void traceQuery.refetch()}
        />
      ) : (
        <div className="gap-space-base p-space-lg flex flex-col">
          <section className="rounded-radius-xl p-space-lg border border-components-console-border bg-components-console-surface">
            <div className="gap-space-lg flex flex-col xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                  {t('flow.pipelineResult.runSummaryTitle')}
                </p>
                <h2 className="mt-space-xs truncate text-xl font-semibold text-text-primary">
                  {agentTitle}
                </h2>
                <p className="mt-space-xs max-w-3xl text-sm text-text-secondary">
                  {t('flow.pipelineResult.runSummaryDescription')}
                </p>
              </div>
              <div className="gap-space-sm grid min-w-0 grid-cols-2 sm:grid-cols-3 xl:w-[620px]">
                {statCards.map(({ label, value, icon }) => (
                  <ResultStatCard
                    key={label}
                    label={label}
                    value={value}
                    icon={icon}
                  />
                ))}
              </div>
            </div>

            <dl className="mt-space-base gap-space-sm grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              {metadata.map(({ label, value, displayValue }) => (
                <MetadataChip
                  key={label}
                  label={label}
                  value={displayValue}
                  fullValue={value}
                />
              ))}
            </dl>
          </section>

          <SectionCard
            title={t('flow.pipelineResult.outputTitle')}
            actions={
              <ResultViewSwitch
                value={activeView}
                onChange={setActiveView}
                t={t}
              />
            }
            padding="none"
            className="overflow-hidden"
          >
            <div className="min-h-0">
              {!outputAvailable ? (
                <div className="p-space-lg">
                  <PageEmptyState
                    scene={AppScene.CONSOLE}
                    compact
                    title={t('flow.pipelineResult.emptyTitle')}
                    description={t('flow.pipelineResult.emptyDescription')}
                  />
                </div>
              ) : (
                <Tabs
                  value={activeView}
                  onValueChange={(value) =>
                    setActiveView(value as PipelineResultView)
                  }
                  className="min-h-0"
                >
                  <div className="gap-space-base p-space-base flex flex-col border-b border-border-subtle lg:flex-row lg:items-center lg:justify-between">
                    <div className="gap-space-sm flex min-w-0 flex-1 flex-col sm:flex-row">
                      <Input
                        inputSize="sm"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t('flow.pipelineResult.searchPlaceholder')}
                        aria-label={t('flow.pipelineResult.searchLabel')}
                        leftIcon={<Search className="size-4" />}
                      />
                      <Select
                        value={typeFilter}
                        onValueChange={(value) =>
                          setTypeFilter(value as PipelineResultChunkType)
                        }
                      >
                        <SelectTrigger
                          className="rounded-radius-md h-10 sm:w-[180px]"
                          aria-label={t('flow.pipelineResult.typeFilter')}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {typeFilterOptions.map((type) => (
                            <SelectItem key={type} value={type}>
                              {getTypeLabel(type, t)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="shrink-0 text-sm font-medium text-text-secondary">
                      {t('flow.pipelineResult.filteredCount', {
                        shown: formatNumber.format(filteredChunks.length),
                        total: formatNumber.format(chunks.length),
                      })}
                    </p>
                  </div>

                  <TabsContent
                    value={PipelineResultView.Chunks}
                    className="p-space-base mt-0"
                  >
                    <div className="gap-space-base grid xl:grid-cols-[minmax(0,1fr)_360px]">
                      <div className="space-y-space-sm min-w-0">
                        {filteredChunks.length > 0 ? (
                          <div className="space-y-space-sm pr-space-xs max-h-[620px] overflow-auto">
                            {filteredChunks.map((chunk, index) => (
                              <ChunkCard
                                key={`${getChunkOrder(chunk, index)}-${index}`}
                                chunk={chunk}
                                index={chunks.indexOf(chunk)}
                                selected={chunk === activeChunk}
                                onSelect={() => setSelectedChunk(chunk)}
                                t={t}
                                formatNumber={formatNumber}
                              />
                            ))}
                          </div>
                        ) : (
                          <PageEmptyState
                            scene={AppScene.CONSOLE}
                            compact
                            title={t('flow.pipelineResult.noChunksTitle')}
                            description={t(
                              'flow.pipelineResult.noChunksDescription',
                            )}
                          />
                        )}
                      </div>

                      <ChunkDetail
                        chunk={activeChunk}
                        index={activeChunkIndex}
                        t={t}
                        formatNumber={formatNumber}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent
                    value={PipelineResultView.Json}
                    className="p-space-base mt-0"
                  >
                    <div className="space-y-space-sm">
                      <div className="gap-space-sm rounded-radius-md bg-surface-secondary p-space-base flex items-start border border-border-subtle text-sm text-text-secondary">
                        <Braces className="mt-0.5 size-4 shrink-0 text-text-tertiary" />
                        <p>{t('flow.pipelineResult.compactJsonHint')}</p>
                      </div>
                      <pre className="rounded-radius-md bg-surface-secondary p-space-base max-h-[620px] overflow-auto font-mono text-xs leading-relaxed text-text-primary">
                        {displayJson}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </SectionCard>
        </div>
      )}
    </ConsolePageTemplate>
  )
}

function compactIdentifier(value: string): string {
  if (value.length <= 18) {
    return value
  }
  return `${value.slice(0, 8)}...${value.slice(-6)}`
}
