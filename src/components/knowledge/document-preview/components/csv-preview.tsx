import { memo, useMemo, type FC } from 'react'
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
        fileKind="csv"
        title={t('knowledge.preview.csvLoadFailed')}
        message={t('knowledge.preview.csvLoadFailed')}
        url={sourceUrl}
      />
    )
  }

  if (!data) {
    return (
      <ErrorState
        fileKind="csv"
        title={t('knowledge.preview.csvEmpty')}
        url={sourceUrl}
      />
    )
  }

  return (
    <div className="scroll-area h-full w-full overflow-auto bg-surface p-space-base">
      <table className="min-w-full divide-y divide-line overflow-hidden rounded-radius-lg border border-line">
        <thead className="bg-surface">
          <tr>
            {data.headers.map((header, index) => (
              <th
                key={`header-${index}`}
                className="border-b border-line bg-sunken px-space-base py-space-sm text-left text-xs font-semibold tracking-wider text-fg uppercase"
              >
                {header ||
                  t('knowledge.preview.columnLabel', { no: index + 1 })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {data.rows.map((row, rowIndex) => (
            <tr
              key={`row-${rowIndex}`}
              className="transition-colors hover:bg-fill-hover"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={`cell-${rowIndex}-${cellIndex}`}
                  className="px-space-base py-space-sm text-sm whitespace-nowrap text-fg-muted"
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
