import { useCallback, useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { getCurrentLanguage } from '@/locales/i18n'
import { formatRelativeTime } from '@/utils/conversation-utils'

/** "Continue working" on the new-chat page: a heading over a card grid. */
export function ContinueSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex flex-col gap-space-sm">
      <h2 id={id} className="text-sm font-semibold text-text-primary">
        {title}
      </h2>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(13rem,100%),1fr))] gap-space-sm">
        {children}
      </ul>
    </section>
  )
}

/** Localized "2 hours ago" for server timestamps in seconds or milliseconds. */
export function useRelativeTime() {
  const { t } = useTranslation()
  return useCallback(
    (value: number | string | undefined) =>
      formatRelativeTime(value, {
        locale: getCurrentLanguage(),
        format: (key, count) =>
          t(`desktop.conversations.time.${key}`, { count }),
      }),
    [t],
  )
}
