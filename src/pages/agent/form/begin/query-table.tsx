import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip } from '@/components/ui/tooltip'
import { useTranslation } from 'react-i18next'
import type { BeginInputEditorItem } from './utils'

type QueryTableProps = {
  data?: BeginInputEditorItem[]
  deleteRecord(index: number): void
  showModal(index?: number, record?: BeginInputEditorItem): void
}

function EllipsisCell({ value }: { value?: string }) {
  if (!value) {
    return <span className="text-text-tertiary">-</span>
  }

  return (
    <Tooltip content={value}>
      <span className="block max-w-48 truncate">{value}</span>
    </Tooltip>
  )
}

export function QueryTable({
  data = [],
  deleteRecord,
  showModal,
}: QueryTableProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-radius-lg border border-border-default bg-surface-secondary">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('flow.key', 'Key')}</TableHead>
            <TableHead>{t('flow.name', 'Name')}</TableHead>
            <TableHead>{t('flow.type', 'Type')}</TableHead>
            <TableHead>{t('flow.optional', 'Optional')}</TableHead>
            <TableHead className="text-right">
              {t('common.action', 'Action')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((record, index) => (
              <TableRow key={`${record.key}-${index}`}>
                <TableCell>
                  <EllipsisCell value={record.key} />
                </TableCell>
                <TableCell>
                  <EllipsisCell value={record.name} />
                </TableCell>
                <TableCell>
                  {t(`flow.${record.type?.toLowerCase()}`, record.type)}
                </TableCell>
                <TableCell>
                  {record.optional
                    ? t('common.yes', 'Yes')
                    : t('common.no', 'No')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-space-xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => showModal(index, record)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => deleteRecord(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-space-lg text-center text-sm text-text-secondary"
              >
                {t('common.noData', 'No data')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
