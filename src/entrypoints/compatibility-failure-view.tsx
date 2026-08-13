import { useTranslation } from 'react-i18next'
import { PageErrorState } from '@/components/patterns'

export function CompatibilityFailure() {
  const { t } = useTranslation()

  return (
    <main className="h-dvh bg-components-app-shell-bg">
      <PageErrorState
        titleAs="h1"
        title={t('routeErrors.unexpected.title', '页面无法显示')}
        description={t(
          'routeErrors.unexpected.description',
          '页面遇到了意外问题，请重新加载。',
        )}
        retryLabel={t('routeErrors.actions.retry', '重新加载')}
        onRetry={() => window.location.reload()}
      />
    </main>
  )
}
