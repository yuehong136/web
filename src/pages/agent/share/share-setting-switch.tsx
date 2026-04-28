import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FormTooltip } from '@/components/ui/tooltip'

interface ShareSettingSwitchProps {
  id: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function ShareSettingSwitch({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: ShareSettingSwitchProps) {
  return (
    <div className="flex min-h-[40px] items-center justify-between gap-space-md py-space-xs">
      <div className="flex items-center gap-space-xs">
        <Label htmlFor={id}>{label}</Label>
        <FormTooltip tooltip={description} />
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  )
}
