import React from 'react'
import { AtSign, Paperclip, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InputToolbarProps {
  isSkillPanelOpen: boolean
  hasSelectedItems: boolean
  disabled?: boolean
  onAtClick: () => void
  atButtonRef?: React.RefObject<HTMLButtonElement>
  size?: 'normal' | 'compact'
}

export const InputToolbar: React.FC<InputToolbarProps> = ({
  isSkillPanelOpen,
  hasSelectedItems,
  disabled = false,
  onAtClick,
  atButtonRef,
  size = 'normal',
}) => {
  const buttonSize = size === 'compact' ? 'w-8 h-8' : 'w-9 h-9'
  const iconSize = size === 'compact' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <div className="flex items-center gap-2">
      <button
        ref={atButtonRef}
        onClick={onAtClick}
        disabled={disabled}
        className={cn(
          buttonSize,
          "rounded-lg flex items-center justify-center transition-colors",
          isSkillPanelOpen || hasSelectedItems
            ? "bg-state-focus-subtle text-state-focus"
            : "hover:bg-background-subtle text-text-tertiary",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <AtSign className={iconSize} />
      </button>
      <button
        disabled={disabled}
        className={cn(
          buttonSize,
          "rounded-lg flex items-center justify-center hover:bg-background-subtle transition-colors",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Paperclip className={cn(iconSize, "text-text-tertiary")} />
      </button>
      {size === 'normal' && (
        <button
          disabled={disabled}
          className={cn(
            buttonSize,
            "rounded-lg flex items-center justify-center hover:bg-background-subtle transition-colors",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Lightbulb className={cn(iconSize, "text-text-tertiary")} />
        </button>
      )}
    </div>
  )
}
