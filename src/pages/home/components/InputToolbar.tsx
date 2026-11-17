import type { FC, RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Paperclip, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  COMPOSER_PILL,
  COMPOSER_PILL_IDLE,
  COMPOSER_PILL_ON,
} from '@/components/patterns/chat/composer-pill'

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

/** Composer pills: add an app or skill (also typed as @); attachments only when wired. */
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
  return (
    <div className="flex items-center gap-space-xs">
      <button
        type="button"
        ref={atButtonRef}
        onClick={onAtClick}
        disabled={disabled}
        aria-label={t('home.input.selectSkills', '选择技能或应用')}
        aria-pressed={isSkillPanelOpen}
        title={t('home.input.selectSkills', '选择技能或应用')}
        className={cn(
          COMPOSER_PILL,
          isSkillPanelOpen || hasSelectedItems
            ? COMPOSER_PILL_ON
            : COMPOSER_PILL_IDLE,
        )}
      >
        <Plus aria-hidden="true" />
      </button>
      {onAttachmentClick && (
        <button
          type="button"
          onClick={onAttachmentClick}
          disabled={disabled}
          className={cn(COMPOSER_PILL, COMPOSER_PILL_IDLE)}
          aria-label={t('home.input.addAttachment', '添加附件')}
        >
          <Paperclip aria-hidden="true" />
        </button>
      )}
      {size === 'normal' && onInspirationClick && (
        <button
          type="button"
          onClick={onInspirationClick}
          disabled={disabled}
          className={cn(COMPOSER_PILL, COMPOSER_PILL_IDLE)}
          aria-label={t('home.input.inspiration', '获取灵感')}
        >
          <Lightbulb aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
