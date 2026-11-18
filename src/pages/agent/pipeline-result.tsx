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
        <div className="flex flex-col gap-space-base p-space-lg">
          <section className="rounded-radius-xl border border-line bg-surface p-space-lg">
            <div className="flex flex-col gap-space-lg xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold tracking-wide text-fg-subtle uppercase">
                  {t('flow.pipelineResult.runSummaryTitle')}
                </p>
                <h2 className="mt-space-xs truncate text-xl font-semibold text-fg">
                  {agentTitle}
                </h2>
                <p className="mt-space-xs max-w-3xl text-sm text-fg-muted">
                  {t('flow.pipelineResult.runSummaryDescription')}
                </p>
              </div>
              <div className="grid min-w-0 grid-cols-2 gap-space-sm sm:grid-cols-3 xl:w-[620px]">
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

            <dl className="mt-space-base grid gap-space-sm sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
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
                  <div className="flex flex-col gap-space-base border-b border-line-subtle p-space-base lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-space-sm sm:flex-row">
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
                          className="h-10 rounded-radius-md sm:w-[180px]"
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
                    <p className="shrink-0 text-sm font-medium text-fg-muted">
                      {t('flow.pipelineResult.filteredCount', {
                        shown: formatNumber.format(filteredChunks.length),
                        total: formatNumber.format(chunks.length),
                      })}
                    </p>
                  </div>

                  <TabsContent
                    value={PipelineResultView.Chunks}
                    className="mt-0 p-space-base"
                  >
                    <div className="grid gap-space-base xl:grid-cols-[minmax(0,1fr)_360px]">
                      <div className="min-w-0 space-y-space-sm">
                        {filteredChunks.length > 0 ? (
                          <div className="max-h-[620px] space-y-space-sm overflow-auto pr-space-xs">
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
                    className="mt-0 p-space-base"
                  >
                    <div className="space-y-space-sm">
                      <div className="flex items-start gap-space-sm rounded-radius-md border border-line-subtle bg-sunken p-space-base text-sm text-fg-muted">
                        <Braces className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
                        <p>{t('flow.pipelineResult.compactJsonHint')}</p>
                      </div>
                      <pre className="max-h-[620px] overflow-auto rounded-radius-md bg-sunken p-space-base font-mono text-xs leading-relaxed text-fg">
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
