/**
 * 工具栏「导入 / 导出」当前编排。导出下载 .json;导入读文件 → 轻量保真解析 →
 * 经 onImport 交回父组件(dispatch reset)。解析/下载逻辑见 {@link ./skeleton-io}。
 */
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { SkeletonSchema } from '../types'
import { downloadSkeleton, parseSkeletonJson } from './skeleton-io'

interface ImportExportButtonsProps {
  skeleton: SkeletonSchema
  onImport: (skeleton: SkeletonSchema) => void
}

export function ImportExportButtons({
  skeleton,
  onImport,
}: ImportExportButtonsProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 复位,允许再次选同一文件
    if (!file) return
    file
      .text()
      .then((text) => {
        onImport(parseSkeletonJson(text))
        toast.success(t('flow.htmlReportImportOk', 'Report imported'))
      })
      .catch(() => {
        toast.error(
          t(
            'flow.htmlReportImportError',
            'Could not import: invalid report file',
          ),
        )
      })
  }

  return (
    <>
      {/* 文件选择是 @/components/ui/input 表达不了的语义,故此处用原生隐藏 input */}
      {/* eslint-disable-next-line no-restricted-syntax */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={skeleton.sections.length === 0}
        onClick={() => downloadSkeleton(skeleton)}
      >
        {t('flow.htmlReportExport', 'Export config')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
      >
        {t('flow.htmlReportImport', 'Import config')}
      </Button>
    </>
  )
}
