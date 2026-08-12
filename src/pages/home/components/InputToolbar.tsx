import React from 'react'
import { useTranslation } from 'react-i18next'
import { AtSign, Paperclip, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InputToolbarProps {
  isSkillPanelOpen: boolean
  hasSelectedItems: boolean
  disabled?: boolean
  onAtClick: () => void
  onAttachmentClick?: () => void
  onInspirationClick?: () => void
  atButtonRef?: React.RefObject<HTMLButtonElement>
  size?: 'normal' | 'compact'
}

export const InputToolbar: React.FC<InputToolbarProps> = ({
  isSkillPanelOpen,
  hasSelectedItems,
  disabled = false,
  onAtClick,
  onAttachmentClick,
  onInspirationClick,
  atButtonRef,
  size = 'normal',
}) => {
  const { t } = useTranslation()
  const buttonSize = size === 'compact' ? 'w-8 h-8' : 'w-9 h-9'
  const iconSize = size === 'compact' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        ref={atButtonRef}
        onClick={onAtClick}
        disabled={disabled}
        aria-label={t('home.input.selectSkills', '选择技能或应用')}
        className={cn(
          buttonSize,
          'flex items-center justify-center rounded-lg transition-colors',
          isSkillPanelOpen || hasSelectedItems
            ? 'bg-state-focus-subtle text-state-focus'
            : 'text-text-tertiary hover:bg-background-subtle',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <AtSign className={iconSize} />
      </button>
      {onAttachmentClick && (
        <button
          type="button"
          onClick={onAttachmentClick}
          disabled={disabled}
          aria-label={t('home.input.addAttachment', '添加附件')}
          className={cn(
            buttonSize,
            'flex items-center justify-center rounded-lg transition-colors hover:bg-background-subtle',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <Paperclip className={cn(iconSize, 'text-text-tertiary')} />
        </button>
      )}
      {size === 'normal' && onInspirationClick && (
        <button
          type="button"
          onClick={onInspirationClick}
          disabled={disabled}
          aria-label={t('home.input.inspiration', '获取灵感')}
          className={cn(
            buttonSize,
            'flex items-center justify-center rounded-lg transition-colors hover:bg-background-subtle',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <Lightbulb className={cn(iconSize, 'text-text-tertiary')} />
        </button>
      )}
    </div>
  )
}
