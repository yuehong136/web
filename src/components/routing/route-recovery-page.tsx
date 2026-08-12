import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CircleOff,
  KeyRound,
  SearchX,
  ServerCrash,
  ShieldX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageErrorState } from '@/components/patterns'
import { ROUTES } from '@/constants'

export enum RouteErrorKind {
  NOT_FOUND = 'not-found',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  SERVER = 'server',
  UNEXPECTED = 'unexpected',
}

interface RouteRecoveryPageProps {
  kind: RouteErrorKind
  onRetry?: () => void
}

const copyKeys = {
  [RouteErrorKind.NOT_FOUND]: 'notFound',
  [RouteErrorKind.UNAUTHORIZED]: 'unauthorized',
  [RouteErrorKind.FORBIDDEN]: 'forbidden',
  [RouteErrorKind.SERVER]: 'server',
  [RouteErrorKind.UNEXPECTED]: 'unexpected',
} as const

const recoveryIcons = {
  [RouteErrorKind.NOT_FOUND]: SearchX,
  [RouteErrorKind.UNAUTHORIZED]: KeyRound,
  [RouteErrorKind.FORBIDDEN]: ShieldX,
  [RouteErrorKind.SERVER]: ServerCrash,
  [RouteErrorKind.UNEXPECTED]: CircleOff,
} as const

export function RouteRecoveryPage({ kind, onRetry }: RouteRecoveryPageProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const copyKey = copyKeys[kind]
  const RecoveryIcon = recoveryIcons[kind]

  useEffect(() => {
    mainRef.current?.focus()
  }, [kind])

  const homeAction = (
    <Button
      type="button"
      data-route-recovery-action="home"
      onClick={() => navigate(ROUTES.HOME, { replace: true })}
    >
      {t('routeErrors.actions.home', '返回首页')}
    </Button>
  )

  let action: React.ReactNode
  if (kind === RouteErrorKind.UNAUTHORIZED) {
    const from = `${location.pathname}${location.search}${location.hash}`
    action = (
      <>
        <Button
          type="button"
          data-route-recovery-action="login"
          onClick={() =>
            navigate(ROUTES.LOGIN, { replace: true, state: { from } })
          }
        >
          {t('routeErrors.actions.login', '重新登录')}
        </Button>
        {homeAction}
      </>
    )
  } else if (
    kind === RouteErrorKind.SERVER ||
    kind === RouteErrorKind.UNEXPECTED
  ) {
    action = (
      <>
        <Button
          type="button"
          data-route-recovery-action="retry"
          onClick={onRetry ?? (() => window.location.reload())}
        >
          {t('routeErrors.actions.retry', '重新加载')}
        </Button>
        {homeAction}
      </>
    )
  } else {
    action = (
      <>
        <Button
          type="button"
          variant="outline"
          data-route-recovery-action="back"
          onClick={() => navigate(-1)}
        >
          {t('routeErrors.actions.back', '返回上一页')}
        </Button>
        {homeAction}
      </>
    )
  }

  return (
    <main
      ref={mainRef}
      tabIndex={-1}
      data-route-error-kind={kind}
      aria-label={t(`routeErrors.${copyKey}.title`)}
      role={kind === RouteErrorKind.NOT_FOUND ? undefined : 'alert'}
      className="min-h-screen bg-background-body outline-none"
    >
      <PageErrorState
        className="min-h-screen"
        titleAs="h1"
        title={t(`routeErrors.${copyKey}.title`)}
        description={t(`routeErrors.${copyKey}.description`)}
        icon={<RecoveryIcon className="size-icon-lg" aria-hidden="true" />}
        action={action}
      />
    </main>
  )
}
