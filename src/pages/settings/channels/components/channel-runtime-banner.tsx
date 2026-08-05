import { RadioTower } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ChannelRuntime } from '@/api/channel'

/**
 * Runtime state strip shown at the top of the edit sheet.
 *
 * The state vocabulary is the server's — six values, mirrored in
 * `RUNTIME_STATES`. `defaultValue` keeps an unrecognised future value legible
 * instead of rendering an empty label.
 */
export const ChannelRuntimeBanner = ({
  runtime,
}: {
  runtime: ChannelRuntime | null | undefined
}) => {
  const { t } = useTranslation()

  return (
    <div className="gap-space-sm rounded-radius-lg bg-surface-secondary p-space-base flex items-center border border-border-subtle text-sm">
      <RadioTower
        className="size-icon-md text-text-secondary"
        aria-hidden="true"
      />
      <span className="text-text-secondary">{t('channel.runtime.label')}:</span>
      <span className="font-medium text-text-primary">
        {runtime?.state
          ? t(`channel.runtime.states.${runtime.state}`, {
              defaultValue: runtime.state,
            })
          : t('channel.runtime.unknown')}
      </span>
    </div>
  )
}
