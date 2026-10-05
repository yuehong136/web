import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PageEmptyState } from '@/components/patterns'
import { ConsolePageTemplate } from '@/components/page-templates'
import { ROUTES } from '@/constants'

const recoveryRoutes = {
  knowledgeImport: ROUTES.KNOWLEDGE,
  documents: ROUTES.KNOWLEDGE,
  workflow: ROUTES.AGENTS,
  appearance: ROUTES.HOME,
} as const

/** Retained legacy URLs disclose availability and offer a working destination. */
export function UnavailableFeaturePage({
  feature,
}: {
  feature: keyof typeof recoveryRoutes
}) {
  const { t } = useTranslation()
  const prefix = `routeErrors.unavailable.${feature}`
  return (
    <ConsolePageTemplate>
      <PageEmptyState
        title={t(`${prefix}.title`)}
        description={t(`${prefix}.description`)}
        action={
          <Button asChild>
            <Link to={recoveryRoutes[feature]}>{t(`${prefix}.action`)}</Link>
          </Button>
        }
      />
    </ConsolePageTemplate>
  )
}
