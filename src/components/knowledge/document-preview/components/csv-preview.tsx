import { memo, useMemo, type FC } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { parse } from 'papaparse'
import { useTranslation } from 'react-i18next'
import type { CSVData } from '../types'
import { ErrorState } from './preview-state'

const CsvPreviewInner: FC<{
  content?: string
  sourceUrl: string
}> = ({ content, sourceUrl }) => {
  const { t } = useTranslation()

  const data = useMemo<CSVData | null>(() => {
    if (content === undefined) return null
    const result = parse<string[]>(content, {
      header: false,
      skipEmptyLines: false,
    })

    const rows = result.data as string[][]
    const headers = rows[0] || []
    const dataRows = rows.slice(1)

    return { headers, rows: dataRows }
  }, [content])

  if (content === undefined) {
    return (
      <ErrorState
        icon={<FileSpreadsheet className="h-16 w-16" />}
        title={t('knowledge.preview.csvLoadFailed')}
        message={t('knowledge.preview.csvLoadFailed')}
        url={sourceUrl}
      />
    )
  }

  if (!data) {
    return (
      <ErrorState
        icon={<FileSpreadsheet className="h-16 w-16" />}
        title={t('knowledge.preview.csvEmpty')}
        url={sourceUrl}
      />
    )
  }

  return (
    <div className="h-full w-full overflow-auto bg-background-surface p-4">
      <table className="min-w-full divide-y divide-border-default overflow-hidden rounded-lg border border-border-default">
        <thead className="bg-background-surface">
          <tr>
            {data.headers.map((header, index) => (
              <th
                key={`header-${index}`}
                className="border-b border-border-default px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-primary"
              >
                {header ||
                  t('knowledge.preview.columnLabel', { no: index + 1 })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {data.rows.map((row, rowIndex) => (
            <tr
              key={`row-${rowIndex}`}
              className="transition-colors hover:bg-state-hover"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={`cell-${rowIndex}-${cellIndex}`}
                  className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary"
                >
                  {cell || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const CsvPreview = memo(CsvPreviewInner)
