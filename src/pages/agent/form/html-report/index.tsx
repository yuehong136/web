/**
 * HTMLReport 节点表单(FormSheet 内)。
 *
 * 持有 RHF 表单(承载 SkeletonSchema)+ 骨架摘要卡 + 打开全屏 Designer 的入口。
 * Designer 保存时 setValue('skeleton'),经 useWatchFormChange 持久化进 graph store。
 * 完整的轻配置(源料输入 / model / temperature)留待 Phase 4。
 */
import { FileChartColumn } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useFetchAgent } from '../../hooks/use-fetch-data'
import { useFormValues } from '../../hooks/use-form-values'
import { useSaveGraph } from '../../hooks/use-save-graph'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import useGraphStore from '../../store'
import type { INextOperatorForm } from '../../types'
import { initialHTMLReportValues } from './constants'
import { Designer } from './designer'
import { summarizeSkeleton } from './skeleton-utils'
import type { SkeletonSchema } from './types'

interface HTMLReportFormValues {
  skeleton: SkeletonSchema
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
    <div className="space-y-space-base p-space-base">
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
        className="w-full"
        leftIcon={<FileChartColumn className="size-icon-sm" />}
        onClick={() => setDesignerOpen(true)}
      >
        {t('flow.htmlReportOpenDesigner', 'Open report designer')}
      </Button>

      <Designer
        open={designerOpen}
        initialSkeleton={skeleton}
        onSave={handleSave}
        onClose={() => setDesignerOpen(false)}
      />
    </div>
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
