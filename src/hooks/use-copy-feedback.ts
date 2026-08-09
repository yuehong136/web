import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { copyToClipboard } from '@/lib/utils'

export function useCopyFeedback(resetDelay = 2000) {
  const { t } = useTranslation()
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})

  const copyWithFeedback = useCallback(
    async (text: string, key: string) => {
      try {
        await copyToClipboard(text)
        setCopiedStates((states) => ({ ...states, [key]: true }))
        setTimeout(
          () => setCopiedStates((states) => ({ ...states, [key]: false })),
          resetDelay,
        )
      } catch (error) {
        console.error('Failed to copy text:', error)
        toast.error(t('common.copyFailed', '复制失败'))
      }
    },
    [resetDelay, t],
  )

  return { copiedStates, copyWithFeedback }
}
