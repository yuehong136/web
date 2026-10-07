import { useTranslation } from 'react-i18next'
import { ArrowLeft, LayoutGrid, Pencil, Save } from 'lucide-react'
import { PageHeader } from '@/components/patterns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { AppConfig } from '../types'
import type { SaveStatus } from '../editor-state'

export interface EditorHeaderProps {
  config: Pick<AppConfig, 'name' | 'icon'>
  saving: boolean
  status: SaveStatus
  disabled?: boolean
  onEdit: () => void
  onSave: () => unknown
  onBack: () => void
}
export function EditorHeader({
  config,
  saving,
  status,
  disabled,
  onEdit,
  onSave,
  onBack,
}: EditorHeaderProps) {
  const { t } = useTranslation()
  return (
    <PageHeader
      compact
      surface="plain"
      align="center"
      wrapActions
      className="min-h-16 border-b border-components-studio-border bg-components-studio-surface px-space-base py-space-sm"
      leading={
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('studio.editor.back')}
          title={t('studio.editor.back')}
          onClick={onBack}
        >
          <ArrowLeft className="size-icon-md" />
        </Button>
      }
      title={
        <span className="flex min-w-0 items-center gap-space-sm">
          <Avatar className="size-8 shrink-0">
            {config.icon && <AvatarImage src={config.icon} alt={config.name} />}
            <AvatarFallback className="bg-background-subtle">
              <LayoutGrid className="size-icon-md text-text-secondary" />
            </AvatarFallback>
          </Avatar>
          <span
            className="min-w-0 truncate text-base font-semibold text-text-primary"
            title={config.name}
          >
            {config.name}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('studio.editor.editInfo')}
            title={t('studio.editor.editInfo')}
            disabled={disabled}
            onClick={onEdit}
          >
            <Pencil className="size-icon-sm" />
          </Button>
        </span>
      }
      actions={
        <>
          <output
            className={`max-w-48 text-xs ${status === 'failed' || status === 'unconfirmed' ? 'text-status-error' : 'text-text-secondary'}`}
          >
            {t(`studio.editor.${status}`)}
          </output>
          <Button
            variant="default"
            size="sm"
            loading={saving}
            disabled={disabled || saving}
            onClick={() => {
              void onSave()
            }}
          >
            <Save className="mr-space-xs size-icon-sm" />
            {t('studio.editor.save')}
          </Button>
        </>
      }
    />
  )
}
