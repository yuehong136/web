/**
 * Designer 预览:mock 填值 → buildReportHtml → iframe。仅含图表时才懒加载 echarts。
 * 草稿变化 debounce 300ms,避免拖拽/输入时频繁重建。
 */
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buildPreviewSchema } from '../mock-fill'
import { buildReportHtml } from '../renderer/build-report-html'
import {
  getCachedEchartsScript,
  loadInlineEchartsScript,
} from '../renderer/echarts-inline'
import type { SkeletonSchema } from '../types'

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function Preview({ skeleton }: { skeleton: SkeletonSchema }) {
  const { t } = useTranslation()
  const debounced = useDebounced(skeleton, 300)
  const [echartsScript, setEchartsScript] = useState<string | null>(() =>
    getCachedEchartsScript(),
  )

  const schema = useMemo(() => buildPreviewSchema(debounced), [debounced])
  const hasCharts = useMemo(
    () =>
      schema.sections.some((section) =>
        section.blocks.some((b) => b.type === 'chart'),
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
        /* 加载失败时图表容器留空,不阻塞其余内容预览 */
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

  if (schema.sections.length === 0) {
    return (
      <div className="p-space-lg text-text-caption flex h-full items-center justify-center text-center text-sm">
        {t(
          'flow.htmlReportPreviewEmpty',
          'The preview shows here as you build the report',
        )}
      </div>
    )
  }

  return (
    <iframe
      title={t('flow.htmlReportPreview', 'Preview')}
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      className="bg-surface-primary h-full w-full border-0"
    />
  )
}
