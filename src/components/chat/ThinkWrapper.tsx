import { memo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { ThinkingStatus } from '@/utils/think-utils'
import { ProcessDisclosure } from './process-disclosure'

export interface ThinkWrapperProps {
  children: ReactNode
  status: ThinkingStatus
  messageId?: string
  _messageId?: string
  titles?: { thinking?: string; complete?: string }
}

export const ThinkWrapper = memo(function ThinkWrapper({
  children,
  status,
  messageId,
  _messageId,
  titles,
}: ThinkWrapperProps) {
  const { t } = useTranslation()
  const loading = status === 'thinking'
  return (
    <ProcessDisclosure
      key={messageId ?? _messageId}
      kind="thinking"
      loading={loading}
      title={
        loading
          ? (titles?.thinking ?? t('chat.thinking.inProgress'))
          : (titles?.complete ?? t('chat.thinking.complete'))
      }
    >
      {children}
    </ProcessDisclosure>
  )
})

export default ThinkWrapper
