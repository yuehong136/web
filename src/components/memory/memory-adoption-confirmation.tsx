import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { MemoryManagedNotice } from './memory-managed-notice'
import type { MemoryCapabilities } from '@/types/memory-revisions'

export function MemoryAdoptionConfirmation({
  managed,
  checked,
  onCheckedChange,
  capabilities,
}: {
  managed: boolean
  checked: boolean
  onCheckedChange: (value: boolean) => void
  capabilities?: MemoryCapabilities
}) {
  const { t } = useTranslation()
  const controlId = useId()
  return (
    <div className="space-y-space-sm">
      {capabilities?.writes ? (
        <MemoryManagedNotice
          capabilities={capabilities}
          activation={!managed}
        />
      ) : (
        <Alert variant="warning">
          {t(
            managed
              ? 'memory.revisions.managedImpact'
              : 'memory.revisions.activationImpact',
          )}
        </Alert>
      )}
      <div className="flex items-start gap-space-sm text-sm">
        <Checkbox
          id={controlId}
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
        />
        <Label htmlFor={controlId}>
          {t('memory.revisions.activationConfirm')}
        </Label>
      </div>
    </div>
  )
}
