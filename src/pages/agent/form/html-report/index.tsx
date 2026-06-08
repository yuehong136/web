/**
 * HTMLReport 节点表单(FormSheet 内)。
 *
 * 承载两类配置:
 * - 运行期输入(给后端的契约):源料上游引用 `query`、填充模型 `llm_id`、温度 `temperature`。
 * - 报告骨架 `skeleton`:摘要卡 + 打开全屏 Designer 的入口。
 *
 * 普通字段经 useWatchFormChange 持久化进 graph store;Designer 保存时另走 handleSave 即时落库。
 */
import { FileChartColumn } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useFetchAgent } from '../../hooks/use-fetch-data'
import { useFormValues } from '../../hooks/use-form-values'
import { useSaveGraph } from '../../hooks/use-save-graph'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import useGraphStore from '../../store'
import type { INextOperatorForm } from '../../types'
import { FormWrapper } from '../components'
import { LLMSelectField } from '../components/llm-select-field'
import { QueryVariable } from '../components/query-variable'
import {
  DEFAULT_FILL_CONCURRENCY,
  DEFAULT_TEMPERATURE,
  initialHTMLReportValues,
} from './constants'
import { Designer } from './designer'
import { summarizeSkeleton } from './skeleton-utils'
import type { SkeletonSchema } from './types'

interface HTMLReportFormValues {
  skeleton: SkeletonSchema
  query?: string
  llm_id?: string
  temperature?: number
  /** 是否并行填充各小节(关则逐节串行) */
  parallel_fill?: boolean
  /** 并行时的并发上限(同时在飞的模型调用数) */
  fill_concurrency?: number
  outputs?: Record<string, unknown>
}

export function HTMLReportForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(
    initialHTMLReportValues,
    node,
  ) as HTMLReportFormValues
  const form = useForm<HTMLReportFormValues>({ defaultValues: values })
  useWatchFormChange(node?.id, form)
  const [designerOpen, setDesignerOpen] = useState(false)

  const { id: agentId } = useParams<{ id: string }>()
  const { data: agent } = useFetchAgent()
  const { saveGraph } = useSaveGraph(agentId, false)
  const updateNodeForm = useGraphStore((s) => s.updateNodeForm)

  const skeleton =
    (form.watch('skeleton') as SkeletonSchema | undefined) ??
    (initialHTMLReportValues.skeleton as SkeletonSchema)
  const summary = summarizeSkeleton(skeleton)

  const handleSave = (next: SkeletonSchema) => {
    form.setValue('skeleton', next, { shouldDirty: true })
    setDesignerOpen(false)

    // Designer 的「保存」需立即落库:setValue→store 的同步是异步的,且画布的
    // 自动保存有 20s 防抖,用户保存后立刻刷新/离开会丢配置。这里直接写 store
    // (updateNodeForm 同步返回最新节点)再即时保存,绕开防抖窗口。
    if (!node?.id || !agentId || !agent?.title) return
    const nextNodes = updateNodeForm(node.id, { skeleton: next })
    const title =
      typeof agent.title === 'string'
        ? agent.title
        : agent.title.zh || agent.title.en || 'Untitled'
    void saveGraph(title, nextNodes)
  }

  return (
    <>
      <Form {...form}>
        <FormWrapper>
          {/* 运行配置:运行时报告据以填充的源料 + 模型 + 温度 */}
          <div className="space-y-space-xs">
            <QueryVariable
              name="query"
              nodeId={node?.id}
              label={t('flow.htmlReportSource', 'Source material')}
            />
            <p className="text-text-caption text-xs">
              {t(
                'flow.htmlReportSourceDesc',
                'Upstream content used to fill the report at run time.',
              )}
            </p>
          </div>

          <LLMSelectField type="chat" valueMode="nameWithProvider" />

          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.temperature', 'Temperature')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={field.value ?? DEFAULT_TEMPERATURE}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 生成性能:是否并行填充各小节 + 并发上限 */}
          <FormField
            control={form.control}
            name="parallel_fill"
            render={({ field }) => (
              <FormItem className="gap-space-base flex items-center justify-between">
                <div className="space-y-space-2xs">
                  <FormLabel>
                    {t('flow.htmlReportParallelFill', 'Parallel fill')}
                  </FormLabel>
                  <p className="text-text-caption text-xs">
                    {t(
                      'flow.htmlReportParallelFillDesc',
                      'Fill sections by calling the model concurrently to speed up generation; off runs section by section.',
                    )}
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value ?? true}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {form.watch('parallel_fill') !== false && (
            <FormField
              control={form.control}
              name="fill_concurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('flow.htmlReportConcurrency', 'Concurrency limit')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={16}
                      step={1}
                      value={field.value ?? DEFAULT_FILL_CONCURRENCY}
                      onChange={(event) =>
                        field.onChange(
                          Math.max(
                            1,
                            Math.floor(
                              Number(event.target.value) ||
                                DEFAULT_FILL_CONCURRENCY,
                            ),
                          ),
                        )
                      }
                    />
                  </FormControl>
                  <p className="text-text-caption text-xs">
                    {t(
                      'flow.htmlReportConcurrencyDesc',
                      'Max simultaneous model calls when parallel (covers section fills and titles).',
                    )}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* 报告骨架摘要 */}
          <div className="space-y-space-sm rounded-radius-lg bg-surface-secondary p-space-base border border-border-default">
            <p className="text-xs font-medium text-text-secondary">
              {t('flow.htmlReportSummaryTitle', 'Report skeleton')}
            </p>
            <div className="gap-space-sm grid grid-cols-2">
              <SummaryStat
                label={t('flow.htmlReportSummarySections', 'Sections')}
                value={summary.sections}
              />
              <SummaryStat
                label={t('flow.htmlReportSummaryBlocks', 'Blocks')}
                value={summary.blocks}
              />
              <SummaryStat
                label={t('flow.htmlReportSummaryCharts', 'Charts')}
                value={summary.charts}
              />
              <SummaryStat
                label={t('flow.htmlReportSummaryPending', 'Fields to fill')}
                value={summary.pending}
              />
            </div>
          </div>

          <Button
            type="button"
            className="w-full"
            leftIcon={<FileChartColumn className="size-icon-sm" />}
            onClick={() => setDesignerOpen(true)}
          >
            {t('flow.htmlReportOpenDesigner', 'Open report designer')}
          </Button>
        </FormWrapper>
      </Form>

      <Designer
        open={designerOpen}
        initialSkeleton={skeleton}
        llmId={form.watch('llm_id')}
        temperature={form.watch('temperature')}
        onSave={handleSave}
        onClose={() => setDesignerOpen(false)}
      />
    </>
  )
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-radius-md bg-surface-primary px-space-sm py-space-xs">
      <div className="text-lg font-semibold text-text-primary">{value}</div>
      <div className="text-text-caption text-xs">{label}</div>
    </div>
  )
}
