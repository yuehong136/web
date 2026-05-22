import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  TooltipRoot as Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface MetadataValueTagProps {
  value: string
  count?: number
  removable?: boolean
  onRemove?: () => void
  disabled?: boolean
  size?: 'sm' | 'md'
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
}

export const MetadataValueTag: FC<MetadataValueTagProps> = ({
  value,
  count,
  removable = false,
  onRemove,
  disabled = false,
  size = 'sm',
  variant = 'default',
  className,
}) => {
  const { t } = useTranslation()
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
  }

  const variantStyles = {
    default: cn(
      'bg-surface-secondary border border-border-default',
      'hover:bg-surface-tertiary hover:border-border-subtle',
      'transition-colors duration-150',
    ),
    outline: cn(
      'bg-transparent border border-border-default',
      'hover:bg-surface-secondary',
      'transition-colors duration-150',
    ),
    ghost: cn(
      'bg-surface-accent/10 border border-transparent',
      'hover:bg-surface-accent/20',
      'transition-colors duration-150',
    ),
  }

  const shouldShowTooltip = value.length > 12

  const tagContent = (
    <span
      className={cn(
        'inline-flex items-center rounded-md',
        'font-normal text-text-primary',
        'group/tag select-none',
        sizeStyles[size],
        variantStyles[variant],
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <span className="max-w-[120px] truncate">{value}</span>

      {count !== undefined && count > 0 && (
        <span className="shrink-0 font-medium tabular-nums text-text-tertiary">
          {count}
        </span>
      )}

      {removable && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className={cn(
            '-mr-0.5 ml-1 h-4 w-4 shrink-0 rounded-sm p-0',
            'text-text-tertiary',
            'opacity-0 group-hover/tag:opacity-100',
            'hover:bg-status-error/10 hover:text-status-error',
            'transition-all duration-150',
          )}
          aria-label={t('knowledge.metadata.editor.removeValueAria', {
            value,
          })}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </span>
  )

  if (shouldShowTooltip) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{tagContent}</TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-[280px] break-words text-xs"
          >
            {value}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return tagContent
}
