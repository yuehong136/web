/**
 * 全屏预览覆盖层。两种来源:
 * - 默认:把当前骨架 mock 填值后预览(Preview variant="full"),编排时看版式。
 * - 导入:载入一份「已产出的报告 JSON」(ReportSchema),用 ReportFrame 直接渲染——
 *   便于把真实工作流/试运行下载的成品报告快速看效果,无需在设计器里重新跑填值。
 *
 * 顶栏按钮在两态间切换;导入解析见 {@link ./skeleton-io} 的 parseReportJson。
 */
import { FileUp, Minimize2, RotateCcw } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ReportFrame } from '../report-frame'
import type { ReportSchema, SkeletonSchema } from '../types'
import { Preview } from './preview'
import { parseReportJson } from './skeleton-io'

interface FullPreviewProps {
  skeleton: SkeletonSchema
  onClose: () => void
}

export function FullPreview({ skeleton, onClose }: FullPreviewProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  // 已导入的成品报告;为 null 时回落到骨架 mock 预览。
  const [report, setReport] = useState<ReportSchema | null>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 复位,允许再次选同一文件
    if (!file) return
    file
      .text()
      .then((text) => {
        setReport(parseReportJson(text))
        toast.success(t('flow.htmlReportPreviewReportOk', 'Report loaded'))
      })
      .catch(() => {
        toast.error(
          t(
            'flow.htmlReportPreviewReportError',
            'Could not load: invalid report JSON',
          ),
        )
      })
  }

  return (
    <div className="bg-surface-primary absolute inset-0 z-10 flex flex-col">
      <div className="gap-space-sm px-space-base py-space-sm flex items-center border-b border-border-default">
        <span className="text-sm font-medium text-text-primary">
          {report
            ? t('flow.htmlReportPreviewReportImported', 'Imported report')
            : t('flow.htmlReportPreview', 'Preview')}
        </span>
        <div className="gap-space-xs ml-auto flex items-center">
          {/* 文件选择是 @/components/ui 表达不了的语义,故此处用原生隐藏 input */}
          {/* eslint-disable-next-line no-restricted-syntax */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFile}
          />
          {report && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="size-icon-sm" />}
              onClick={() => setReport(null)}
            >
              {t(
                'flow.htmlReportPreviewBackToSkeleton',
                'Back to skeleton preview',
              )}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileUp className="size-icon-sm" />}
            onClick={() => fileInputRef.current?.click()}
          >
            {t('flow.htmlReportPreviewImportReport', 'Import report')}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label={t('flow.htmlReportPreviewExit', 'Exit preview')}
          >
            <Minimize2 className="size-icon-sm" />
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {report ? (
          <ReportFrame
            schema={report}
            title={
              report.title ||
              t('flow.htmlReportPreviewReportImported', 'Imported report')
            }
          />
        ) : (
          <Preview skeleton={skeleton} variant="full" />
        )}
      </div>
    </div>
  )
}
