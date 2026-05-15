import { memo, useCallback, useEffect, useState, type FC } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { parse } from 'papaparse'
import { useTranslation } from 'react-i18next'
import type { CSVData } from '../types'
import { fetchWithAuth, isAbortError } from '../utils'
import { ErrorState, LoadingState } from './preview-state'

const CsvPreviewInner: FC<{
  url: string
}> = ({ url }) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CSVData | null>(null)

  const parseCSV = useCallback((csvText: string): CSVData => {
    const result = parse<string[]>(csvText, {
      header: false,
      skipEmptyLines: false,
    })

    const rows = result.data as string[][]
    const headers = rows[0] || []
    const dataRows = rows.slice(1)

    return { headers, rows: dataRows }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let mounted = true

    const loadCsv = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetchWithAuth(url, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(
            t('knowledge.preview.csvLoadFailedWithStatus', {
              status: response.status,
            }),
          )
        }

        const text = await response.text()
        const parsedData = parseCSV(text)

        if (mounted) {
          setData(parsedData)
          setLoading(false)
        }
      } catch (err) {
        if (isAbortError(err)) return
        if (mounted) {
          console.error('CSV load error:', err)
          setError(
            err instanceof Error
              ? err.message
              : t('knowledge.preview.csvLoadFailed'),
          )
          setLoading(false)
        }
      }
    }

    loadCsv()

    return () => {
      mounted = false
      controller.abort()
      setData(null)
    }
  }, [t, url, parseCSV])

  if (loading) {
    return <LoadingState message={t('knowledge.preview.loadingCsv')} />
  }

  if (error) {
    return (
      <ErrorState
        icon={<FileSpreadsheet className="h-16 w-16" />}
        title={t('knowledge.preview.csvLoadFailed')}
        message={error}
        url={url}
      />
    )
  }

  if (!data) {
    return (
      <ErrorState
        icon={<FileSpreadsheet className="h-16 w-16" />}
        title={t('knowledge.preview.csvEmpty')}
        url={url}
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
