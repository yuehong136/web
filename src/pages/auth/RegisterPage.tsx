import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useAuthStore } from '@/stores/auth'
import { ROUTES } from '@/constants'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { PlatformKind, usePlatform } from '@/platform'
import { AuthAlert } from './components/auth-alert'
import { AuthHeading, LoginFrame } from './components/login-frame'

interface FormData {
  nickname: string
  email: string
  password: string
  confirmPassword: string
  company: string
  role: string
}

const steps = ['personal', 'account', 'work'] as const

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const platform = usePlatform()
  const { register: registerUser, isLoading } = useAuthStore()
  const [currentStep, setCurrentStep] = React.useState(0)
  const [formData, setFormData] = React.useState<FormData>({
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    role: '',
  })
  const [showPassword, _setShowPassword] = React.useState(false)
  const [showConfirmPassword, _setShowConfirmPassword] = React.useState(false)
  const [failed, setFailed] = React.useState(false)

  const progress = ((currentStep + 1) / steps.length) * 100
  const step = steps[currentStep]

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setFailed(false)
    try {
      // Only the fields the backend accepts are sent.
      await registerUser({
        nickname: formData.nickname,
        email: formData.email,
        password: formData.password,
      })
      navigate(ROUTES.HOME)
    } catch (error: any) {
      console.error('Registration failed:', error.message || 'unknown error')
      setFailed(true)
    }
  }

  return (
    <LoginFrame desktop={platform.kind === PlatformKind.DESKTOP}>
      <AuthHeading
        title={t('auth.register.title')}
        description={t('auth.register.description')}
      />

      <div className="mb-space-lg">
        <div className="mb-space-xs flex justify-between text-xs text-text-tertiary">
          <span>
            {t('auth.register.stepOf', {
              current: currentStep + 1,
              total: steps.length,
            })}
          </span>
          <span>
            {t('auth.register.percentComplete', {
              percent: Math.round(progress),
            })}
          </span>
        </div>
        <Progress value={progress} />
        <div className="mt-space-sm">
          <h2 className="text-sm font-medium text-text-primary">
            {t(`auth.register.steps.${step}.title`)}
          </h2>
          <p className="text-xs text-text-secondary">
            {t(`auth.register.steps.${step}.description`)}
          </p>
        </div>
      </div>

      <form
        className="flex flex-col gap-space-base"
        aria-busy={isLoading || undefined}
      >
        {failed ? (
          <AuthAlert tone="error">{t('auth.register.failed')}</AuthAlert>
        ) : null}
        {step === 'personal' && (
          <>
            <div>
              <Label htmlFor="nickname">{t('auth.register.nickname')}</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                placeholder={t('auth.register.nicknamePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="email">{t('auth.login.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={t('auth.login.emailPlaceholder')}
              />
            </div>
          </>
        )}

        {step === 'account' && (
          <>
            <div>
              <Label htmlFor="password">{t('auth.login.password')}</Label>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder={t('auth.register.passwordPlaceholder')}
              />
              <p className="mt-space-2xs text-xs text-text-tertiary">
                {t('auth.register.passwordHint')}
              </p>
            </div>
            <div>
              <Label htmlFor="confirmPassword">
                {t('auth.register.confirmPassword')}
              </Label>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange('confirmPassword', e.target.value)
                }
                placeholder={t('auth.register.confirmPasswordPlaceholder')}
              />
            </div>
          </>
        )}

        {step === 'work' && (
          <>
            <div>
              <Label htmlFor="company">{t('auth.register.company')}</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder={t('auth.register.companyPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="role">{t('auth.register.role')}</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                placeholder={t('auth.register.rolePlaceholder')}
              />
            </div>
          </>
        )}

        <div className="flex gap-space-sm pt-space-sm">
          {currentStep > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              className="flex-1"
            >
              {t('auth.register.previous')}
            </Button>
          )}
          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={handleNext} className="flex-1">
              {t('auth.register.next')}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" />
                  {t('auth.register.submitting')}
                </>
              ) : (
                t('auth.register.submit')
              )}
            </Button>
          )}
        </div>
      </form>

      <p className="mt-space-lg border-t border-border-subtle pt-space-base text-center text-sm text-text-secondary">
        {t('auth.register.haveAccount')}{' '}
        <Link
          to={ROUTES.LOGIN}
          className="rounded-radius-sm font-medium text-text-accent underline-offset-2 outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-state-focus"
        >
          {t('auth.register.signIn')}
        </Link>
      </p>
    </LoginFrame>
  )
}
