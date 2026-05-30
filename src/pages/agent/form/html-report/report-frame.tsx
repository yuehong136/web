/**
 * 消费端渲染:ReportSchema → buildReportHtml → 沙箱 iframe(srcDoc)。含图表时才懒加载并
 * 内联 echarts。供 Designer「试运行」结果与日后 runtime-chat 展示共用(决策 #31)。
 *
 * 纯展示组件:进来一份已填好的 ReportSchema,出一个自包含报告。不调 LLM、不碰骨架。
 */
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { buildReportHtml } from './renderer/build-report-html'
import {
  getCachedEchartsScript,
  loadInlineEchartsScript,
} from './renderer/echarts-inline'
import type { ReportSchema } from './types'

interface ReportFrameProps {
  schema: ReportSchema
  title?: string
  className?: string
}

export function ReportFrame({ schema, title, className }: ReportFrameProps) {
  const [echartsScript, setEchartsScript] = useState<string | null>(() =>
    getCachedEchartsScript(),
  )

  const hasCharts = useMemo(
    () =>
      schema.sections.some((section) =>
        section.blocks.some((block) => block.type === 'chart'),
      ),
    [schema],
  )

  useEffect(() => {
    if (!hasCharts || echartsScript !== null) return
    let active = true
    loadInlineEchartsScript()
      .then((script) => {
        if (active) setEchartsScript(script)
      })
      .catch(() => {
        // 加载失败:置空串(已尝试)→ 照常渲染报告、图表容器留空,不永远卡在加载态
        if (active) setEchartsScript('')
      })
    return () => {
      active = false
    }
  }, [hasCharts, echartsScript])

  // 含图表时必须等 echarts 就绪后再「一次性」构建 srcDoc。否则会先渲染无 echarts 的小文档、
  // echarts 到位后再把 srcDoc 热替换成 ~1.1MB 大文档——对 sandbox iframe 的 srcdoc 大幅热替换
  // 有概率白屏(正是「首次试运行黑屏、第二次正常」的根因:仅首次 echarts 未缓存才会经历该替换)。
  const ready = !hasCharts || echartsScript !== null

  const srcDoc = useMemo(
    () =>
      ready
        ? buildReportHtml(schema, { echartsScript: echartsScript || undefined })
        : '',
    [ready, schema, echartsScript],
  )

  if (!ready) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background-surface">
        <Loader2 className="size-icon-md text-text-caption animate-spin" />
      </div>
    )
  }

  return (
    <iframe
      title={title ?? 'report'}
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      className={className ?? 'bg-surface-primary h-full w-full border-0'}
    />
  )
}
