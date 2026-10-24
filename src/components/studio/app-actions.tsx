import { useTranslation } from 'react-i18next'
import { Download, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  ActionMenu,
  ActionMenuTrigger,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuSeparator,
} from '@/components/ui/action-menu'
import { Button } from '@/components/ui/button'
import type { DialogApp } from '@/types/api'

export interface AppActionProps {
  data: DialogApp
  onEdit?: (app: DialogApp) => void
  onDelete?: (app: DialogApp) => void
  onExport?: (app: DialogApp) => void
}
export function AppActions({
  data,
  onEdit,
  onDelete,
  onExport,
}: AppActionProps) {
  const { t } = useTranslation()
  if (!onEdit && !onDelete && !onExport) return null
  return (
    <ActionMenu>
      <ActionMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('studio.card.actionsFor', { name: data.name })}
        >
          <MoreHorizontal className="size-icon-sm" aria-hidden="true" />
        </Button>
      </ActionMenuTrigger>
      <ActionMenuContent align="end">
        {onEdit && (
          <ActionMenuItem onSelect={() => onEdit(data)}>
            <Pencil className="size-icon-sm" aria-hidden="true" />
            {t('studio.card.edit')}
          </ActionMenuItem>
        )}
        {onExport && (
          <ActionMenuItem onSelect={() => onExport(data)}>
            <Download className="size-icon-sm" aria-hidden="true" />
            {t('studio.card.exportTemplate')}
          </ActionMenuItem>
        )}
        {onDelete && (
          <>
            <ActionMenuSeparator />
            <ActionMenuItem danger onSelect={() => onDelete(data)}>
              <Trash2 className="size-icon-sm" aria-hidden="true" />
              {t('studio.card.delete')}
            </ActionMenuItem>
          </>
        )}
      </ActionMenuContent>
    </ActionMenu>
  )
}
