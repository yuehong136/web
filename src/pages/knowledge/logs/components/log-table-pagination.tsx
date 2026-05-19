import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface LogTablePaginationProps {
  page: number
  pageSize: number
  total: number
  onChange: (page: number, pageSize?: number) => void
}

export function LogTablePagination({
  page,
  pageSize,
  total,
  onChange,
}: LogTablePaginationProps) {
  const { t } = useTranslation()
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-text-secondary">
        {t('knowledge.logs.table.pagination', {
          total,
          page,
          totalPages: totalPages || 1,
        })}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
        >
          {t('knowledge.logs.table.previous')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
        >
          {t('knowledge.logs.table.next')}
        </Button>
      </div>
    </div>
  )
}
