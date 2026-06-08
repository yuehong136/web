/**
 * 试运行成品:整屏覆盖呈现,报告在全宽视口里按自身宽度展示,而非挤在小卡片里。
 * 刻意复用 Designer「全屏预览」那套已验证的 `<div absolute inset-0 flex flex-col>` +
 * `flex-1` iframe 范式(不用 `<dialog>`,避开其 UA 默认尺寸/居中样式带来的撑不满问题)。
 *
 * 纯展示——进来已填好的 ReportSchema + 失败计数,出按钮回调。
 */
import { ArrowLeft, Download, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ReportFrame } from '../report-frame'
import type { ReportSchema } from '../types'
import { downloadReportSchema } from './skeleton-io'

interface RunResultProps {
  schema: ReportSchema
  failedRegions: number
  failedSections: number
  /** 退回输入态(保留对话框,不销毁) */
  onBack: () => void
  /** 关闭整个试运行,回到画布 */
  onClose: () => void
}

export function RunResult({
  schema,
  failedRegions,
  failedSections,
  onBack,
  onClose,
}: RunResultProps) {
  const { t } = useTranslation()
  const hasWarn = failedRegions > 0 || failedSections > 0
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-background-surface">
      <div className="gap-space-sm px-space-base py-space-sm flex items-center border-b border-border-default">
        <span className="text-sm font-medium text-text-primary">
          {t('flow.htmlReportRunResult', 'Trial run result')}
        </span>
        {hasWarn && (
          <span className="text-xs text-status-warning">
            {failedRegions > 0 &&
              t('flow.htmlReportRunRegionFailed', {
                count: failedRegions,
                defaultValue:
                  '{{count}} generative region(s) could not be expanded',
              })}
            {failedRegions > 0 && failedSections > 0 && ' · '}
            {failedSections > 0 &&
              t('flow.htmlReportRunPartial', {
                count: failedSections,
                defaultValue: '{{count}} section(s) could not be filled',
              })}
          </span>
        )}
        <div className="gap-space-xs ml-auto flex items-center">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="size-icon-sm" />}
            onClick={onBack}
          >
            {t('flow.htmlReportRunBack', 'Back to inputs')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="size-icon-sm" />}
            onClick={() => downloadReportSchema(schema)}
          >
            {t('flow.htmlReportRunExportStructure', 'Export structure')}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label={t('common.close', 'Close')}
          >
            <X className="size-icon-sm" />
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ReportFrame
          schema={schema}
          title={t('flow.htmlReportRunResult', 'Trial run result')}
        />
      </div>
    </div>
  )
}
