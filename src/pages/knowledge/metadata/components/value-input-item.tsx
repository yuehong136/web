import React, { memo } from 'react'
import { Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ValueInputItemProps {
  value: string
  index: number
  placeholder: string
  disabled?: boolean
  onChange: (index: number, value: string) => void
  onDelete: (index: number) => void
  onBlur: (index: number) => void
}

export const ValueInputItem = memo(function ValueInputItem({
  value,
  index,
  placeholder,
  disabled,
  onChange,
  onDelete,
  onBlur,
}: ValueInputItemProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => onChange(index, e.target.value)}
        onBlur={() => onBlur(index)}
        placeholder={placeholder}
        className="flex-1"
        disabled={disabled}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onDelete(index)}
        disabled={disabled}
        className="hover:bg-status-error/10 hover:text-status-error h-9 w-9 shrink-0 p-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
})
