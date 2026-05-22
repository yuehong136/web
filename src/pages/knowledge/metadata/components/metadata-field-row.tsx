import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings, Trash2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  TooltipRoot as Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MetadataValueTag } from './metadata-value-tag'

interface MetadataFieldRowProps {
  field: string
  description?: string
  values: Array<{ value: string; count?: number }>
  maxDisplayValues?: number
  showDescription?: boolean
  allowRemoveValue?: boolean
  onRemoveValue?: (value: string) => void
  onEdit?: () => void
  onDelete?: () => void
  disabled?: boolean
  className?: string
}

export const MetadataFieldRow: FC<MetadataFieldRowProps> = ({
  field,
  description,
  values,
  maxDisplayValues = 3,
  showDescription = false,
  allowRemoveValue = false,
  onRemoveValue,
  onEdit,
  onDelete,
  disabled = false,
  className,
}) => {
  const { t } = useTranslation()
  const displayValues = values.slice(0, maxDisplayValues)
  const remainingCount = Math.max(0, values.length - maxDisplayValues)

  return (
    <div
      className={cn(
        'group flex items-center',
        'border-border-default/60 border-b last:border-b-0',
        'bg-surface-primary hover:bg-surface-secondary/40',
        'transition-all duration-200 ease-out',
        disabled && 'opacity-60',
        className,
      )}
    >
      <div className="w-[140px] shrink-0 px-4 py-3">
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block cursor-default truncate text-sm font-medium text-text-accent">
                {field}
              </span>
            </TooltipTrigger>
            {field.length > 16 && (
              <TooltipContent side="top" className="text-xs">
                {field}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {showDescription && (
        <div className="w-[160px] shrink-0 px-4 py-3">
          <TooltipProvider delayDuration={400}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block cursor-default truncate text-sm text-text-secondary">
                  {description || '-'}
                </span>
              </TooltipTrigger>
              {description && description.length > 18 && (
                <TooltipContent side="top" className="max-w-[240px] text-xs">
                  {description}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <div className="min-w-0 flex-1 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {displayValues.length > 0 ? (
            <>
              {displayValues.map(({ value, count }) => (
                <MetadataValueTag
                  key={value}
                  value={value}
                  count={count}
                  removable={allowRemoveValue}
                  onRemove={() => onRemoveValue?.(value)}
                  disabled={disabled}
                  variant="outline"
                />
              ))}
              {remainingCount > 0 && (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="bg-surface-secondary/60 inline-flex cursor-default items-center rounded px-1.5 py-0.5 text-xs text-text-tertiary">
                        +{remainingCount}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {t('knowledge.metadata.editor.moreValues', {
                        count: remainingCount,
                      })}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </>
          ) : (
            <span className="text-sm text-text-tertiary">-</span>
          )}
        </div>
      </div>

      <div className="flex w-[88px] shrink-0 items-center justify-end gap-0.5 px-2 py-3">
        <div
          className={cn(
            'flex items-center gap-0.5',
            'opacity-0 group-hover:opacity-100',
            'transition-all duration-200',
          )}
        >
          {onEdit && (
            <TooltipProvider delayDuration={500}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    disabled={disabled}
                    className={cn(
                      'h-7 w-7 p-0',
                      'hover:bg-surface-accent/10 hover:text-text-accent',
                      'transition-colors duration-150',
                    )}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {t('knowledge.metadata.editor.edit')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {onDelete && (
            <TooltipProvider delayDuration={500}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    disabled={disabled}
                    className={cn(
                      'h-7 w-7 p-0',
                      'hover:bg-status-error/10 hover:text-status-error',
                      'transition-colors duration-150',
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {t('knowledge.metadata.editor.delete')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {onEdit && (
          <ChevronRight
            className={cn(
              'h-4 w-4 text-text-tertiary',
              'opacity-0 group-hover:opacity-60',
              'transition-opacity duration-200',
              'ml-1',
            )}
          />
        )}
      </div>
    </div>
  )
}
