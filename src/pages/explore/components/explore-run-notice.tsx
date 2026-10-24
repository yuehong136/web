import { useTranslation } from 'react-i18next'
import { getRunPhaseNotice, type RunPhase } from '@/lib/streaming'

export function ExploreRunNotice({ phase }: { phase?: RunPhase }) {
  const { t } = useTranslation()
  const key = phase ? getRunPhaseNotice(phase) : null
  if (!key) return null
  return (
    <output
      className="block text-sm text-text-secondary"
      data-run-notice={phase}
    >
      {t(key)}
    </output>
  )
}
