import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Plus, TestTube } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { EnvironmentFormData } from './environment-form-state'
import { BASE_URL_EXAMPLE, isValidBaseUrl } from './environment-variables'

type FormChange = (
  field: keyof EnvironmentFormData,
  value: string | boolean,
) => void

/** Name, description and default switch of the environment being edited. */
export function EnvironmentDetailHeader({
  form,
  onChange,
  dotClassName,
  isNew,
  isGlobal,
}: {
  form: EnvironmentFormData
  onChange: FormChange
  dotClassName: string
  isNew: boolean
  isGlobal: boolean
}) {
  const { t } = useTranslation()
  const id = useId()
  return (
    <header className="flex flex-wrap items-start gap-space-base border-b border-border-subtle px-space-lg py-space-base">
      <div className="min-w-0 flex-1 basis-64 space-y-space-2xs">
        <div className="flex items-center gap-space-sm">
          <span
            aria-hidden="true"
            className={cn('size-2 shrink-0 rounded-radius-full', dotClassName)}
          />
          <Input
            value={form.name}
            onChange={(event) => onChange('name', event.target.value)}
            aria-label={t('environment.detail.nameLabel')}
            placeholder={t(
              isNew
                ? 'environment.detail.newNamePlaceholder'
                : 'environment.detail.namePlaceholder',
            )}
            className="min-h-0 border-transparent bg-transparent px-space-xs py-space-2xs text-lg font-semibold text-text-primary hover:border-border-subtle"
          />
        </div>
        <Textarea
          value={form.description}
          onChange={(event) => onChange('description', event.target.value)}
          aria-label={t('environment.detail.descriptionLabel')}
          placeholder={t('environment.detail.descriptionPlaceholder')}
          rows={2}
          className="ml-space-base min-h-0 w-auto border-transparent bg-transparent px-space-xs py-space-2xs text-sm text-text-secondary hover:border-border-subtle"
        />
      </div>
      <div className="flex shrink-0 items-center gap-space-base pt-space-xs">
        <div className="flex items-center gap-space-sm">
          <Switch
            id={`${id}-default`}
            checked={form.is_default}
            onCheckedChange={(checked) => onChange('is_default', checked)}
          />
          <Label htmlFor={`${id}-default`} className="text-sm">
            {t('environment.detail.isDefault')}
          </Label>
        </div>
        {isNew ? (
          <Badge variant="blue">{t('environment.detail.newBadge')}</Badge>
        ) : null}
        {isGlobal ? (
          <Badge variant="outline">
            <Globe className="size-icon-xs" aria-hidden="true" />
            {t('environment.detail.globalBadge')}
          </Badge>
        ) : null}
      </div>
    </header>
  )
}

/** A hairline card with a title row and optional actions. */
export function EnvironmentSection({
  title,
  actions,
  children,
  className,
}: {
  title: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <section
      aria-labelledby={id}
      className={cn(
        'rounded-radius-xl border border-border-subtle bg-components-card-bg',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-space-sm px-space-md pt-space-md pb-space-sm">
        <h3 id={id} className="text-sm font-semibold text-text-primary">
          {title}
        </h3>
        {actions ? (
          <div className="flex flex-wrap items-center gap-space-sm">
            {actions}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/** The base URL every API reference request starts with. */
export function BaseUrlSection({
  value,
  onChange,
}: {
  value: string
  onChange: FormChange
}) {
  const { t } = useTranslation()
  const invalid = Boolean(value) && !isValidBaseUrl(value)
  return (
    <EnvironmentSection title={t('environment.detail.baseUrl')}>
      <div className="px-space-md pb-space-md">
        <Input
          value={value}
          onChange={(event) => onChange('base_url', event.target.value)}
          aria-label={t('environment.detail.baseUrl')}
          placeholder={BASE_URL_EXAMPLE}
          className="font-mono"
          inputMode="url"
          spellCheck={false}
          autoComplete="off"
          error={
            invalid
              ? t('environment.detail.baseUrlInvalid', {
                  example: BASE_URL_EXAMPLE,
                })
              : undefined
          }
          helpText={t('environment.detail.baseUrlHint', {
            example: BASE_URL_EXAMPLE,
          })}
        />
      </div>
    </EnvironmentSection>
  )
}

/** The variables card: resolution test and add actions above the table. */
export function VariablesSection({
  onTestResolve,
  onAddVariable,
  testDisabled = false,
  children,
}: {
  onTestResolve: () => void
  onAddVariable: () => void
  testDisabled?: boolean
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <EnvironmentSection
      title={t('environment.detail.variables')}
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onTestResolve}
            disabled={testDisabled}
            leftIcon={<TestTube aria-hidden="true" />}
          >
            {t('environment.detail.testResolve')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddVariable}
            leftIcon={<Plus aria-hidden="true" />}
          >
            {t('environment.detail.addVariable')}
          </Button>
        </>
      }
    >
      <div className="px-space-md pb-space-md">{children}</div>
    </EnvironmentSection>
  )
}

/** Shown in place of a variables table that has no rows yet. */
export function VariablesEmpty() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-space-xs rounded-radius-lg border border-dashed border-border-default px-space-md py-space-xl text-center">
      <span className="mb-space-xs flex size-10 items-center justify-center rounded-radius-full bg-components-page-state-icon-bg text-components-page-state-icon">
        <Plus className="size-icon-md" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-text-primary">
        {t('environment.variables.empty')}
      </p>
      <p className="text-xs text-text-tertiary">
        {t('environment.variables.emptyHint')}
      </p>
    </div>
  )
}
