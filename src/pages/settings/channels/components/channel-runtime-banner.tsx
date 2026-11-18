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
    <div className="flex flex-col gap-space-xs rounded-radius-lg border border-line-subtle bg-sunken p-space-base text-sm">
      <div className="flex items-center gap-space-sm">
        <RadioTower className="size-icon-md text-fg-muted" aria-hidden="true" />
        <span className="text-fg-muted">{t('channel.runtime.label')}:</span>
        <span className="font-medium text-fg">
          {runtime?.state
            ? t(`channel.runtime.states.${runtime.state}`, {
                defaultValue: runtime.state,
              })
            : t('channel.runtime.unknown')}
        </span>
      </div>
      {runtime?.last_error_code ? (
        <output className="text-xs text-danger-fg">
          {t('channel.runtime.errorCode', { code: runtime.last_error_code })}
        </output>
      ) : null}
    </div>
  )
}
