import React, { memo } from 'react'
import { PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FormFieldDisplayProps {
  label: string
  value: string
  onEdit?: () => void
  editable?: boolean
  description?: string
}

export const FormFieldDisplay: React.FC<FormFieldDisplayProps> = memo(({
  label,
  value,
  onEdit,
  editable = true,
  description,
}) => (
  <div className="flex items-start gap-4">
    <label className="w-48 text-sm font-medium text-text-primary shrink-0">
      {label}
    </label>
    <div className="flex-1 flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'text-sm text-text-primary flex-1 rounded-md py-1.5 px-3',
            editable && 'border border-border-default'
          )}
        >
          {value || '-'}
        </div>
        {editable && onEdit && (
          <Button
            variant="ghost"
            type="button"
            onClick={onEdit}
            className="text-sm text-text-secondary flex gap-1.5 px-2 border border-border-default hover:bg-components-card-bg-hover"
            size="sm"
          >
            <PenLine className="w-3 h-3" /> 编辑
          </Button>
        )}
      </div>
      {description && (
        <span className="text-text-tertiary text-xs">{description}</span>
      )}
    </div>
  </div>
))

FormFieldDisplay.displayName = 'FormFieldDisplay'
