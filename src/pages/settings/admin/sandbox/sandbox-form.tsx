import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { adminAPI } from '@/api/admin'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import { toast } from '@/lib/toast'
import { SandboxField } from './sandbox-field'
import { sandboxSubmitConfig, type SshAuthMode } from './config-values'
import type { SandboxConfig, SandboxSchema, SandboxValue } from './types'

export function SandboxForm({
  saved,
  schema,
  available,
}: {
  saved: SandboxConfig
  schema: SandboxSchema
  available: boolean
}) {
  const { t } = useTranslation()
  const cache = useQueryClient()
  const [values, setValues] = useState<Record<string, SandboxValue>>(
    saved.config,
  )
  const [cleared, setCleared] = useState<string[]>([])
  const [authMode, setAuthMode] = useState<SshAuthMode>(
    saved.configured_secrets.includes('private_key')
      ? 'private_key'
      : 'password',
  )
  const [setActive, setSetActive] = useState(
    saved.active_provider_type === saved.provider_type,
  )
  const provider = saved.provider_type
  const submit = () =>
    sandboxSubmitConfig(values, schema, provider, authMode, cleared)
  const save = useMutation({
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: () => adminAPI.saveSandboxConfig(provider, submit(), setActive),
    onSuccess: async (data) => {
      setValues(data.config)
      setCleared([])
      setAuthMode(
        data.configured_secrets.includes('private_key')
          ? 'private_key'
          : 'password',
      )
      setSetActive(data.active_provider_type === data.provider_type)
      test.reset()
      await cache.invalidateQueries({ queryKey: ['admin', 'sandbox'] })
      toast.success(t('sandbox.saved'))
    },
  })
  const test = useMutation({
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: () => adminAPI.testSandboxConnection(provider, submit()),
  })
  const busy = save.isPending || test.isPending
  function changeAuthMode(value: string) {
    const mode = value as SshAuthMode
    const inactive =
      mode === 'password' ? ['private_key', 'passphrase'] : ['password']
    setAuthMode(mode)
    setValues((previous) =>
      Object.fromEntries(
        Object.entries(previous).filter(([key]) => !inactive.includes(key)),
      ),
    )
    setCleared((previous) => [...new Set([...previous, ...inactive])])
    test.reset()
    save.reset()
  }
  function renderField(name: string) {
    const field = schema[name]
    return (
      <SandboxField
        key={name}
        name={name}
        field={field}
        value={values[name]}
        savedSecret={
          saved.configured_secrets.includes(name) && !cleared.includes(name)
        }
        onChange={(value) => {
          setValues((previous) => ({ ...previous, [name]: value }))
          setCleared((previous) => previous.filter((key) => key !== name))
          test.reset()
          save.reset()
        }}
        onClear={() => {
          setCleared((previous) => [...new Set([...previous, name])])
          setValues((previous) => ({ ...previous, [name]: '' }))
        }}
      />
    )
  }
  const runtime = Object.keys(schema).filter(
    (name) => !schema[name].readonly && schema[name].scope !== 'deployment',
  )
  const deployment = Object.keys(schema).filter(
    (name) => schema[name].readonly || schema[name].scope === 'deployment',
  )
  const authFields = new Set(['password', 'private_key', 'passphrase'])
  const error = save.error ?? test.error
  return (
    <form
      className="space-y-space-lg"
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate()
      }}
    >
      {provider === 'local' ? (
        <p className="rounded-radius-lg bg-status-warning-subtle p-space-base text-sm text-text-secondary">
          {t('sandbox.localWarning')}
        </p>
      ) : null}
      {provider === 'ssh' ? (
        <p className="text-sm text-text-secondary">{t('sandbox.sshHint')}</p>
      ) : null}
      {saved.environment_overrides.length > 0 ? (
        <p className="text-sm text-text-secondary">
          {t('sandbox.overrides', {
            fields: saved.environment_overrides.join(', '),
          })}
        </p>
      ) : null}
      <fieldset
        disabled={busy || !available}
        className="min-w-0 space-y-space-lg"
      >
        <legend className="mb-space-base font-medium">
          {t('sandbox.runtime')}
        </legend>
        <div className="grid min-w-0 gap-space-md md:grid-cols-2">
          {runtime
            .filter((name) => provider !== 'ssh' || !authFields.has(name))
            .map(renderField)}
        </div>
        {provider === 'ssh' ? (
          <div className="space-y-space-md rounded-radius-lg border border-border-subtle p-space-base">
            <h3 className="text-sm font-medium">
              {t('sandbox.authentication')}
            </h3>
            <Tabs value={authMode} onValueChange={changeAuthMode}>
              <TabsList>
                <TabsTrigger value="password">
                  {t('sandbox.password')}
                </TabsTrigger>
                <TabsTrigger value="private_key">
                  {t('sandbox.privateKey')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="password">
                {renderField('password')}
              </TabsContent>
              <TabsContent value="private_key" className="space-y-space-md">
                {['private_key', 'passphrase'].map(renderField)}
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
        <div className="flex items-center gap-space-sm">
          <Switch
            id="sandbox-set-active"
            checked={setActive}
            onCheckedChange={setSetActive}
          />
          <Label htmlFor="sandbox-set-active">{t('sandbox.useProvider')}</Label>
        </div>
        <div className="flex flex-wrap gap-space-sm">
          <Button type="submit" disabled={busy || !available}>
            {save.isPending ? t('sandbox.saving') : t('sandbox.save')}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy || !available}
            onClick={(event) => {
              if (event.currentTarget.form?.reportValidity()) test.mutate()
            }}
          >
            {test.isPending ? t('sandbox.testing') : t('sandbox.test')}
          </Button>
        </div>
      </fieldset>
      {!available ? (
        <p aria-live="polite" className="text-sm text-status-warning">
          {t('sandbox.localDisabled')}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-status-error">
          {error.message}
        </p>
      ) : null}
      {test.data ? (
        <div
          aria-live="polite"
          className="space-y-space-sm rounded-radius-lg border border-border-subtle p-space-base"
        >
          <p
            className={
              test.data.success ? 'text-status-success' : 'text-status-error'
            }
          >
            {test.data.success
              ? t('sandbox.testPassed')
              : t('sandbox.testFailed')}
          </p>
          <pre className="max-w-full overflow-auto text-xs break-words whitespace-pre-wrap text-text-secondary">
            {test.data.details.stdout}
            {test.data.details.stderr}
          </pre>
        </div>
      ) : null}
      {deployment.length > 0 ? (
        <details className="space-y-space-md rounded-radius-lg border border-border-subtle p-space-base">
          <summary className="cursor-pointer font-medium">
            {t('sandbox.deployment')}
          </summary>
          <p className="text-sm text-text-secondary">
            {t('sandbox.deploymentHint')}
          </p>
          <div className="grid gap-space-md md:grid-cols-2">
            {deployment.map(renderField)}
          </div>
        </details>
      ) : null}
    </form>
  )
}
