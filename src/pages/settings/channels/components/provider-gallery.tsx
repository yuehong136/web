import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { RenderableProviderManifest } from '@/api/channel'
import { Badge } from '@/components/ui/badge'
import { ProviderLogo } from './provider-logo'

/**
 * The providers this deployment can connect, as a browsable grid.
 *
 * Replaces a lone "New channel" button that hid every provider behind a select
 * inside a sheet: nothing on the page said what could be connected, so the
 * answer was only discoverable by starting to create something.
 *
 * Driven entirely by `manifest`. The obvious alternative — a client-side list
 * of known providers — is the pattern this whole subsystem spent its
 * refactor removing: a second place each provider must be declared, and the
 * one that gets forgotten. A provider registered on the server therefore shows
 * up here with no frontend release, artwork excepted.
 */
export const ProviderGallery = ({
  providers,
  connectedCounts,
  disabled,
  onSelect,
}: {
  providers: RenderableProviderManifest[]
  connectedCounts: Record<string, number>
  disabled: boolean
  onSelect: (provider: string) => void
}) => {
  const { t } = useTranslation()

  return (
    <section
      className="space-y-space-base"
      aria-labelledby="channel-available-heading"
    >
      <div>
        <h3
          id="channel-available-heading"
          className="font-semibold text-text-primary"
        >
          {t('channel.gallery.title')}
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          {t('channel.gallery.description')}
        </p>
      </div>

      {providers.length === 0 ? (
        <p className="py-space-base text-sm text-text-secondary">
          {t('channel.filter.noMatchProvider')}
        </p>
      ) : null}

      <ul className="grid grid-cols-1 gap-space-base md:grid-cols-2 2xl:grid-cols-3">
        {providers.map((manifest) => {
          const connected = connectedCounts[manifest.provider] ?? 0
          return (
            <li key={manifest.provider}>
              {/* A button, not a clickable div. The upstream version this is
                  modelled on puts onClick on an <article>, which cannot be
                  reached by Tab and ignores Enter and Space. */}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(manifest.provider)}
                className="group flex h-full w-full items-start gap-space-base rounded-radius-lg border border-border-subtle p-space-base text-left transition-colors hover:border-border-strong hover:bg-background-subtle focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-60"
              >
                <ProviderLogo
                  provider={manifest.provider}
                  displayName={manifest.display_name}
                  className="size-icon-lg shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-space-sm">
                    <span className="truncate font-medium text-text-primary">
                      {/* Our translation wins, the server's English name is
                          the fallback — so a provider registered after the
                          last frontend release still gets a real title. */}
                      {t(`channel.providers.${manifest.provider}.name`, {
                        defaultValue: manifest.display_name,
                      })}
                    </span>
                    {connected > 0 ? (
                      <Badge variant="secondary" className="shrink-0">
                        {t('channel.gallery.connectedCount', {
                          count: connected,
                        })}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
                    {/* Server copy is the fallback, our translation wins when
                        we have one — so a provider added after the last
                        frontend release still reads as a real product. */}
                    {manifest.description_i18n_key
                      ? t(manifest.description_i18n_key, {
                          defaultValue: manifest.description ?? '',
                        })
                      : (manifest.description ?? '')}
                  </p>
                </div>
                <span
                  className="flex shrink-0 items-center gap-space-xs text-sm text-text-secondary group-hover:text-text-primary"
                  aria-hidden="true"
                >
                  <Plus className="size-icon-sm" />
                  {t('channel.gallery.connect')}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
