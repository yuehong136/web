import { memo, useEffect, useRef, useState, type FC } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ErrorState, LoadingState } from './preview-state'

const ExcelPreviewInner: FC<{
  arrayBuffer?: ArrayBuffer
  sourceUrl: string
}> = ({ arrayBuffer, sourceUrl }) => {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const previewerRef = useRef<ReturnType<
    typeof import('@js-preview/excel').default.init
  > | null>(null)

  useEffect(() => {
    let mounted = true

    const loadExcel = async () => {
      if (!containerRef.current) return

      try {
        setLoading(true)
        setError(null)

        const jsPreviewExcel = await import('@js-preview/excel')
        await import('@js-preview/excel/lib/index.css')

        if (!arrayBuffer) {
          throw new Error(t('knowledge.preview.excelPreviewFailed'))
        }

        if (!mounted || !containerRef.current) return

        if (previewerRef.current) {
          previewerRef.current.destroy()
        }

        const excelPreviewer = jsPreviewExcel.default.init(containerRef.current)
        previewerRef.current = excelPreviewer

        await excelPreviewer.preview(arrayBuffer)

        if (mounted) {
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          console.error('Excel preview error:', err)
          setError(
            err instanceof Error
              ? err.message
              : t('knowledge.preview.excelPreviewFailed'),
          )
          setLoading(false)
        }
      }
    }

    loadExcel()

    return () => {
      mounted = false
      if (previewerRef.current) {
        previewerRef.current.destroy()
        previewerRef.current = null
      }
    }
  }, [arrayBuffer, t])

  if (error) {
    return (
      <ErrorState
        icon={<FileSpreadsheet className="h-16 w-16" />}
        title={t('knowledge.preview.excelPreviewFailed')}
        message={error}
        url={sourceUrl}
      />
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-background-surface">
      {loading && (
        <div className="absolute inset-0 z-10">
          <LoadingState message={t('knowledge.preview.loadingExcel')} />
        </div>
      )}
      <div
        ref={containerRef}
        className="excel-csv-previewer h-full w-full rounded-md border border-border-default p-4"
      />
    </div>
  )
}

export const ExcelPreview = memo(ExcelPreviewInner)
