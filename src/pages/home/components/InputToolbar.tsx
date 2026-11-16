import type { FC, RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { AtSign, Paperclip, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface InputToolbarProps {
  isSkillPanelOpen: boolean
  hasSelectedItems: boolean
  disabled?: boolean
  onAtClick: () => void
  onAttachmentClick?: () => void
  onInspirationClick?: () => void
  atButtonRef?: RefObject<HTMLButtonElement>
  size?: 'normal' | 'compact'
}

/** Composer pills: pick an app or skill with @; attachments only when wired. */
export const InputToolbar: FC<InputToolbarProps> = ({
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
  const buttonSize = size === 'compact' ? 'icon-sm' : 'icon'
  return (
    <div className="flex items-center gap-space-2xs">
      <Button
        type="button"
        ref={atButtonRef}
        variant="ghost"
        size={buttonSize}
        onClick={onAtClick}
        disabled={disabled}
        aria-label={t('home.input.selectSkills', '选择技能或应用')}
        aria-pressed={isSkillPanelOpen}
        className={cn(
          (isSkillPanelOpen || hasSelectedItems) &&
            'bg-state-selected-bg text-state-selected-text hover:bg-state-selected-bg',
        )}
      >
        <AtSign aria-hidden="true" />
      </Button>
      {onAttachmentClick && (
        <Button
          type="button"
          variant="ghost"
          size={buttonSize}
          onClick={onAttachmentClick}
          disabled={disabled}
          aria-label={t('home.input.addAttachment', '添加附件')}
        >
          <Paperclip aria-hidden="true" />
        </Button>
      )}
      {size === 'normal' && onInspirationClick && (
        <Button
          type="button"
          variant="ghost"
          size={buttonSize}
          onClick={onInspirationClick}
          disabled={disabled}
          aria-label={t('home.input.inspiration', '获取灵感')}
        >
          <Lightbulb aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
