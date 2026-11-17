import { useConsumedSearchFlag } from '@/hooks/use-consumed-search-flag'
import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { ROUTES } from '@/constants'
import { useAuthStore } from '@/stores/auth'
import { getSafeLoginRedirect } from '../login-redirect'
import { AuthAlert } from './auth-alert'
import { AuthHeading } from './login-frame'

export const LoginForm: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const isLoading = useAuthStore((state) => state.isLoading)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showExpiredAlert, setShowExpiredAlert] = useConsumedSearchFlag(
    'expired',
    'true',
  )
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
    if (!showExpiredAlert) return
    const timer = window.setTimeout(() => setShowExpiredAlert(false), 8000)
    return () => window.clearTimeout(timer)
  }, [showExpiredAlert, setShowExpiredAlert])

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
    <div className="w-full">
      <AuthHeading
        title={t('auth.login.title')}
        description={t('auth.login.description')}
      />

      {showExpiredAlert ? (
        <AuthAlert
          tone="warning"
          className="mb-space-lg"
          title={t('auth.login.expiredTitle')}
          dismissLabel={t('auth.login.closeAlert')}
          onDismiss={() => setShowExpiredAlert(false)}
        >
          {t('auth.login.expiredDescription')}
        </AuthAlert>
      ) : null}

      <form
        className="flex flex-col gap-space-base"
        onSubmit={handleSubmit(onSubmit)}
        aria-busy={isLoading || undefined}
        noValidate
      >
        {errors.root ? (
          <AuthAlert tone="error">{errors.root.message}</AuthAlert>
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
          leftIcon={<LockKeyhole className="size-icon-sm" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-pressed={showPassword}
              className="flex rounded-radius-sm text-text-tertiary outline-hidden transition-colors hover:text-text-secondary focus-visible:ring-2 focus-visible:ring-state-focus"
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

        <div className="flex items-center gap-space-xs">
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

        <Button
          type="submit"
          size="lg"
          className="mt-space-xs w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner size="sm" className="mr-space-xs" />
              {t('auth.login.submitting')}
            </>
          ) : (
            t('auth.login.submit')
          )}
        </Button>
      </form>

      {isRegistrationEnabled ? (
        <p className="mt-space-lg border-t border-border-subtle pt-space-base text-center text-sm text-text-secondary">
          {t('auth.login.noAccount')}{' '}
          <Link
            to={ROUTES.REGISTER}
            className="rounded-radius-sm font-medium text-text-accent underline-offset-2 outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-state-focus"
          >
            {t('auth.login.register')}
          </Link>
        </p>
      ) : null}
    </div>
  )
}
