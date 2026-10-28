import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TenantModel } from '@/api/llm-provider-types'
import { ModelCapabilities } from '@/components/models/model-capabilities'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export function InstanceModelRow({
  model,
  pending,
  onToggle,
  onRemove,
}: {
  model: TenantModel
  pending: boolean
  onToggle: (active: boolean) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <li className="flex items-center justify-between gap-space-base py-3">
      <div className="min-w-0 space-y-1.5">
        <p
          className="truncate text-sm font-medium text-text-primary"
          title={model.name}
        >
          {model.name}
        </p>
        <ModelCapabilities types={model.model_types} tools={model.is_tools} />
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Switch
          aria-label={t('settings.models.instances.enabled', {
            name: model.name,
          })}
          checked={model.status === 'active'}
          disabled={pending}
          onCheckedChange={onToggle}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8 text-text-tertiary"
              aria-label={t('common.modelPicker.actions', { name: model.name })}
            >
              <MoreHorizontal aria-hidden className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-52 p-1"
            aria-label={t('common.modelPicker.actions', { name: model.name })}
          >
            <p className="text-xs font-normal text-text-secondary">
              {t('common.modelPicker.identity', { id: model.id })}
            </p>
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setOpen(false)
                onRemove()
              }}
              className="h-8 w-full justify-start text-status-error"
            >
              <Trash2 aria-hidden className="size-4" />
              {t('common.delete')}
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    </li>
  )
}
