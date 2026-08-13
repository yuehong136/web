import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Eye, EyeOff, Mail, X } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import { ROUTES } from '@/constants'
import { useAuthStore } from '@/stores/auth'
import { getSafeLoginRedirect } from '../login-redirect'

export const LoginForm: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const login = useAuthStore((state) => state.login)
  const isLoading = useAuthStore((state) => state.isLoading)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showExpiredAlert, setShowExpiredAlert] = React.useState(false)
  const isRegistrationEnabled =
    import.meta.env.VITE_ENABLE_REGISTRATION === 'true'

  const schema = React.useMemo(
    () =>
      z.object({
        email: z.string().email(t('auth.login.validation.email')),
        password: z.string().min(4, t('auth.login.validation.password')),
        remember: z.boolean().optional(),
      }),
    [t],
  )
  type LoginFormData = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
    defaultValues: { remember: false },
  })

  React.useEffect(() => {
    if (searchParams.get('expired') !== 'true') return

    setShowExpiredAlert(true)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('expired')
    setSearchParams(nextParams, { replace: true })
    const timer = window.setTimeout(() => setShowExpiredAlert(false), 8000)
    return () => window.clearTimeout(timer)
  }, [searchParams, setSearchParams])

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password, data.remember)
      const from = (location.state as { from?: unknown } | null)?.from
      navigate(getSafeLoginRedirect(from), { replace: true })
    } catch {
      setError('root', { message: t('common.errors.loginFailed') })
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-space-xl">
        <h1 className="mb-space-xs text-2xl font-bold text-text-primary">
          {t('auth.login.title')}
        </h1>
        <p className="text-text-secondary">{t('auth.login.description')}</p>
      </div>

      {showExpiredAlert ? (
        <div
          className="mb-space-lg px-space-md py-space-base rounded-radius-lg shadow-elevation-low animate-fade-in border border-components-alert-warning-border bg-components-alert-warning-bg text-components-alert-warning-text"
          role="alert"
        >
          <div className="flex items-center">
            <AlertTriangle className="size-icon-md shrink-0" />
            <div className="ml-space-sm flex-1">
              <h2 className="text-sm font-medium">
                {t('auth.login.expiredTitle')}
              </h2>
              <p className="mt-space-2xs text-xs">
                {t('auth.login.expiredDescription')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowExpiredAlert(false)}
              className="ml-space-sm rounded-radius-md p-space-xs text-components-alert-warning-text hover:bg-status-warning-subtle focus:outline-none focus:ring-2 focus:ring-state-focus"
              aria-label={t('auth.login.closeAlert')}
            >
              <X className="size-icon-sm" />
            </button>
          </div>
        </div>
      ) : null}

      <form className="space-y-space-base" onSubmit={handleSubmit(onSubmit)}>
        {errors.root ? (
          <div
            className="px-space-md py-space-base rounded-radius-md border border-components-alert-error-border bg-components-alert-error-bg text-components-alert-error-text"
            role="alert"
          >
            {errors.root.message}
          </div>
        ) : null}

        <Input
          label={t('auth.login.email')}
          type="email"
          autoComplete="email"
          autoFocus
          required
          {...register('email')}
          error={errors.email?.message}
          leftIcon={<Mail className="size-icon-sm" />}
          placeholder={t('auth.login.emailPlaceholder')}
        />

        <Input
          label={t('auth.login.password')}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          required
          {...register('password')}
          error={errors.password?.message}
          placeholder={t('auth.login.passwordPlaceholder')}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="text-text-tertiary transition-colors hover:text-text-secondary"
              aria-label={
                showPassword
                  ? t('auth.login.hidePassword')
                  : t('auth.login.showPassword')
              }
            >
              {showPassword ? (
                <EyeOff className="size-icon-sm" />
              ) : (
                <Eye className="size-icon-sm" />
              )}
            </button>
          }
        />

        <div className="gap-space-xs flex items-center">
          <Controller
            name="remember"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="remember-me"
                aria-label={t('auth.login.remember')}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <label
            htmlFor="remember-me"
            className="cursor-pointer text-sm text-text-primary"
          >
            {t('auth.login.remember')}
          </label>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loading variant="spinner" size="sm" className="mr-space-xs" />
              {t('auth.login.submitting')}
            </>
          ) : (
            t('auth.login.submit')
          )}
        </Button>
      </form>

      {isRegistrationEnabled ? (
        <div className="mt-space-xl text-center text-sm text-text-secondary">
          {t('auth.login.noAccount')}{' '}
          <Link
            to={ROUTES.REGISTER}
            className="hover:text-text-accent/80 font-medium text-text-accent"
          >
            {t('auth.login.register')}
          </Link>
        </div>
      ) : null}
    </div>
  )
}
