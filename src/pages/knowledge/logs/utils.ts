import { getCurrentLanguage } from '@/locales/i18n'

export function formatSecondsToHumanReadable(seconds: number): string {
  const language = getCurrentLanguage()
  const rounded = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(rounded / 60)
  const remainingSeconds = rounded % 60
  const hours = Math.floor(rounded / 3600)
  const remainingMinutes = Math.floor((rounded % 3600) / 60)

  if (rounded < 60) {
    return new Intl.NumberFormat(language, {
      style: 'unit',
      unit: 'second',
      unitDisplay: 'narrow',
      maximumFractionDigits: 0,
    }).format(rounded)
  }

  if (rounded < 3600) {
    const minutePart = new Intl.NumberFormat(language, {
      style: 'unit',
      unit: 'minute',
      unitDisplay: 'narrow',
      maximumFractionDigits: 0,
    }).format(minutes)
    const secondPart =
      remainingSeconds > 0
        ? new Intl.NumberFormat(language, {
            style: 'unit',
            unit: 'second',
            unitDisplay: 'narrow',
            maximumFractionDigits: 0,
          }).format(remainingSeconds)
        : ''
    return secondPart ? `${minutePart} ${secondPart}` : minutePart
  }

  const hourPart = new Intl.NumberFormat(language, {
    style: 'unit',
    unit: 'hour',
    unitDisplay: 'narrow',
    maximumFractionDigits: 0,
  }).format(hours)
  const minutePart =
    remainingMinutes > 0
      ? new Intl.NumberFormat(language, {
          style: 'unit',
          unit: 'minute',
          unitDisplay: 'narrow',
          maximumFractionDigits: 0,
        }).format(remainingMinutes)
      : ''
  return minutePart ? `${hourPart} ${minutePart}` : hourPart
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleString(getCurrentLanguage(), {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return dateString
  }
}
