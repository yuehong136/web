/**
 * Designer 预览:mock 填值 → buildReportHtml → iframe。仅含图表时才懒加载 echarts。
 * 草稿变化 debounce 300ms,避免拖拽/输入时频繁重建。
 *
 * 两种呈现:
 * - panel(默认)→ 侧栏窄,把报告按固定逻辑宽度 {@link LOGICAL_WIDTH} 渲染后整体
 *   缩放适配,使多栏布局在窄栏里也能如实显示(否则渲染器的 720px 媒体查询会把多栏
 *   塌成单栏,看上去"布局切换无效")。
 * - full → 全屏预览,iframe 充满容器,报告按自身 max-width 居中,文字可读。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { buildPreviewSchema } from '../mock-fill'
import { buildReportHtml } from '../renderer/build-report-html'
import {
  getCachedEchartsScript,
  loadInlineEchartsScript,
} from '../renderer/echarts-inline'
import type { SkeletonSchema } from '../types'

/** panel 模式下的逻辑渲染宽度,略高于渲染器 720px 多栏塌缩断点 */
const LOGICAL_WIDTH = 768

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

interface PreviewProps {
  skeleton: SkeletonSchema
  variant?: 'panel' | 'full'
}

export function Preview({ skeleton, variant = 'panel' }: PreviewProps) {
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

  const title = t('flow.htmlReportPreview', 'Preview')

  if (variant === 'full') {
    return (
      <iframe
        title={title}
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        className="bg-surface-primary h-full w-full border-0"
      />
    )
  }

  return <ScaledFrame title={title} srcDoc={srcDoc} />
}

/** 把固定逻辑宽度的报告整体缩放到容器宽度,使窄栏也能如实显示多栏布局。 */
function ScaledFrame({ title, srcDoc }: { title: string; srcDoc: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const scaled = size.width > 0 && size.width < LOGICAL_WIDTH
  const scale = scaled ? size.width / LOGICAL_WIDTH : 1

  return (
    <div
      ref={ref}
      className="bg-surface-secondary h-full w-full overflow-hidden"
    >
      <iframe
        title={title}
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        className="bg-surface-primary border-0"
        style={
          scaled
            ? {
                width: LOGICAL_WIDTH,
                height: size.height / scale,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }
            : { width: '100%', height: '100%' }
        }
      />
    </div>
  )
}
