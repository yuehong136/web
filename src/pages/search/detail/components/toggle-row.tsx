import React, { memo } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface ToggleRowProps {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, checked, onCheckedChange }) => {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export default memo(ToggleRow)