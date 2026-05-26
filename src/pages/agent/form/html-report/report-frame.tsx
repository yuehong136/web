/**
 * 消费端渲染:ReportSchema → buildReportHtml → 沙箱 iframe(srcDoc)。含图表时才懒加载并
 * 内联 echarts。供 Designer「试运行」结果与日后 runtime-chat 展示共用(决策 #31)。
 *
 * 纯展示组件:进来一份已填好的 ReportSchema,出一个自包含报告。不调 LLM、不碰骨架。
 */
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
    if (!hasCharts || echartsScript) return
    let active = true
    loadInlineEchartsScript()
      .then((script) => {
        if (active) setEchartsScript(script)
      })
      .catch(() => {
        /* 加载失败时图表容器留空,不阻塞其余内容 */
      })
    return () => {
      active = false
    }
  }, [hasCharts, echartsScript])

  const srcDoc = useMemo(
    () =>
      buildReportHtml(schema, { echartsScript: echartsScript ?? undefined }),
    [schema, echartsScript],
  )

  return (
    <iframe
      title={title ?? 'report'}
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      className={className ?? 'bg-surface-primary h-full w-full border-0'}
    />
  )
}
