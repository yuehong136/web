import i18n, { getCurrentLanguage } from '@/locales/i18n'

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
}

const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}

export function formatDocumentDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m ${remainingSeconds.toFixed(0)}s`
}

export function formatDocumentFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function formatDocumentDate(dateStr: string): string {
  return new Intl.DateTimeFormat(
    getCurrentLanguage(),
    DATE_TIME_OPTIONS,
  ).format(new Date(dateStr))
}

export function formatDocumentRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  if (diffMs < 0 || diffMs < 60_000) {
    return i18n.t('knowledge.documents.time.justNow')
  }

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 60) {
    return new Intl.RelativeTimeFormat(getCurrentLanguage(), {
      numeric: 'auto',
    }).format(-minutes, 'minute')
  }

  const time = new Intl.DateTimeFormat(
    getCurrentLanguage(),
    TIME_OPTIONS,
  ).format(date)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86_400_000)
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (dateDay.getTime() === today.getTime()) {
    return i18n.t('knowledge.documents.time.todayAt', { time })
  }
  if (dateDay.getTime() === yesterday.getTime()) {
    return i18n.t('knowledge.documents.time.yesterdayAt', { time })
  }

  if (date.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat(getCurrentLanguage(), {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  }

  return new Intl.DateTimeFormat(getCurrentLanguage(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
