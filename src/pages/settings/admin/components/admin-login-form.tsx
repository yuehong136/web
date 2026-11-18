import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { adminAPI, setAdminToken } from '@/api/admin'
import { SettingsTemplate } from '@/components/page-templates/settings-template'
import { SettingRow, SettingSection } from '@/components/patterns/setting-row'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type LoginError = 'required' | 'failed' | null

/** Administrator sign-in for the separate admin service. */
export function AdminLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  // A fixed message only; the service's error text is never shown.
  const [error, setError] = useState<LoginError>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email || !password) {
      setError('required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { token } = await adminAPI.login(email, password)
      setAdminToken(token)
      onSuccess()
    } catch {
      setError('failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SettingsTemplate
      title={t('settings.admin.login.title')}
      description={t('settings.admin.login.description')}
    >
      <form onSubmit={(event) => void submit(event)} noValidate>
        <SettingSection>
          <SettingRow
            label={t('settings.admin.login.email')}
            htmlFor="admin-login-email"
          >
            <div className="w-full sm:w-64">
              <Input
                id="admin-login-email"
                type="email"
                inputSize="sm"
                autoComplete="username"
                placeholder={t('settings.admin.login.emailPlaceholder')}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setError(null)
                }}
              />
            </div>
          </SettingRow>
          <SettingRow
            label={t('settings.admin.form.password')}
            htmlFor="admin-login-password"
          >
            <div className="w-full sm:w-64">
              <Input
                id="admin-login-password"
                type={showPassword ? 'text' : 'password'}
                inputSize="sm"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError(null)
                }}
                rightIcon={
                  <button
                    type="button"
                    aria-label={t(
                      showPassword
                        ? 'settings.admin.login.hidePassword'
                        : 'settings.admin.login.showPassword',
                    )}
                    onClick={() => setShowPassword((value) => !value)}
                    className="rounded-radius-sm text-fg-subtle outline-hidden hover:text-fg-muted focus-visible:ring-2 focus-visible:ring-line-focus"
                  >
                    {showPassword ? (
                      <EyeOff className="size-icon-sm" aria-hidden="true" />
                    ) : (
                      <Eye className="size-icon-sm" aria-hidden="true" />
                    )}
                  </button>
                }
              />
            </div>
          </SettingRow>
          <div className="flex flex-wrap items-center justify-end gap-space-sm border-t border-line-subtle pt-space-sm">
            {error ? (
              <p role="alert" className="mr-auto text-sm text-danger-fg">
                {t(
                  error === 'required'
                    ? 'settings.admin.login.required'
                    : 'settings.admin.login.failed',
                )}
              </p>
            ) : null}
            <Button
              type="submit"
              size="sm"
              loading={loading}
              leftIcon={<LogIn className="size-icon-sm" aria-hidden="true" />}
            >
              {t('settings.admin.login.submit')}
            </Button>
          </div>
        </SettingSection>
      </form>
    </SettingsTemplate>
  )
}
