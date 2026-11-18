import { useTranslation } from 'react-i18next'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import { Badge } from '@/components/ui/badge'
import { getCurrentLanguage } from '@/locales/i18n'
import type { ProviderGroup } from '../../catalog'
import { PREFIX } from '../../utils'

/** A provider the gateway cannot relay yet, collapsed into one muted card. */
export function UnsupportedProviderCard({ group }: { group: ProviderGroup }) {
  const { t } = useTranslation()
  const names = group.connections.flatMap((connection) =>
    connection.models.map((model) => model.model_name),
  )
  const list = new Intl.ListFormat(getCurrentLanguage(), {
    type: 'conjunction',
    style: 'narrow',
  }).format([...new Set(names)])
  return (
    <section
      aria-label={group.provider}
      className="flex flex-wrap items-center gap-space-md rounded-radius-xl border border-line-subtle bg-sunken px-space-lg py-space-md"
    >
      <ProviderLogo provider={group.provider} size="md" />
      <div className="min-w-0 flex-[1_1_16rem]">
        <div className="flex flex-wrap items-center gap-space-xs">
          <h3 className="text-sm font-semibold text-fg">{group.provider}</h3>
          <Badge variant="outline">
            {t(`${PREFIX}.states.provider_not_supported`)}
          </Badge>
        </div>
        <p className="mt-space-2xs text-xs text-fg-subtle">
          {t(`${PREFIX}.models.unsupportedDetail`, { models: list })}
        </p>
      </div>
    </section>
  )
}
