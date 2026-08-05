import { RadioTower } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ChannelRuntime } from '@/api/channel'

/**
 * Runtime state strip shown at the top of the edit sheet.
 *
 * The state vocabulary is the server's — six values, mirrored in
 * `RUNTIME_STATES`. `defaultValue` keeps an unrecognised future value legible
 * instead of rendering an empty label.
 *
 * The reason line matters more than it looks: the server now synthesises
 * `error` for a channel whose runner is alive and heartbeating but whose bound
 * release went stale (CHN-O1). Without the code beside it, the one panel an
 * admin opens to diagnose a silent channel would say "error" and stop there,
 * while the card behind the sheet already showed why. `last_error_code` is
 * null on every older backend, so this renders nothing there.
 */
export const ChannelRuntimeBanner = ({
  runtime,
}: {
  runtime: ChannelRuntime | null | undefined
}) => {
  const { t } = useTranslation()

  return (
    <div className="gap-space-xs rounded-radius-lg bg-surface-secondary p-space-base flex flex-col border border-border-subtle text-sm">
      <div className="gap-space-sm flex items-center">
        <RadioTower
          className="size-icon-md text-text-secondary"
          aria-hidden="true"
        />
        <span className="text-text-secondary">
          {t('channel.runtime.label')}:
        </span>
        <span className="font-medium text-text-primary">
          {runtime?.state
            ? t(`channel.runtime.states.${runtime.state}`, {
                defaultValue: runtime.state,
              })
            : t('channel.runtime.unknown')}
        </span>
      </div>
      {runtime?.last_error_code ? (
        <output className="text-xs text-status-error">
          {t('channel.runtime.errorCode', { code: runtime.last_error_code })}
        </output>
      ) : null}
    </div>
  )
}
