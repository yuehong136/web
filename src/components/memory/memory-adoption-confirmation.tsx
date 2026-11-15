import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'

export function MemoryAdoptionConfirmation({
  managed,
  checked,
  onCheckedChange,
}: {
  managed: boolean
  checked: boolean
  onCheckedChange: (value: boolean) => void
}) {
  const { t } = useTranslation()
  const controlId = useId()
  return (
    <div className="space-y-space-sm">
      <Alert variant="warning">
        {t(
          managed
            ? 'memory.revisions.managedImpact'
            : 'memory.revisions.activationImpact',
        )}
      </Alert>
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
