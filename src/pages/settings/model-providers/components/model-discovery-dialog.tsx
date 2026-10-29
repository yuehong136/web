import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiClient } from '@/api/client'
import { modelProvidersAPI } from '@/api/llm-providers'
import type {
  ConnectionCandidate,
  DiscoveredModel,
  InstanceInput,
  InstanceModelInput,
  ModelDiscoveryPage,
} from '@/api/llm-provider-types'
import { useModelProviderMutation } from '@/hooks/use-model-provider-request'
import { useAuthStore } from '@/stores/auth'
import { ModelCapabilities } from '@/components/models/model-capabilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns/page-states'

// Only provider protocols supported by the discovery endpoint use this form.
export const supportsModelDiscovery = (provider: string) =>
  ['Ollama', 'Fish Audio', 'MinerU'].includes(provider)

/** Presentation metadata must never leak into model registration payloads. */
export function discoveredModelRegistration(
  model: DiscoveredModel,
): InstanceModelInput {
  return {
    model_name: model.model_name,
    model_types: [...model.model_types],
    max_tokens: model.max_tokens,
    is_tools: model.is_tools,
  }
}

type Props = {
  provider: string
  close: () => void
  configureManually?: () => void
}
export function ModelDiscoveryDialog(props: Props) {
  const owner = useAuthStore(
    (state) => `${state.user?.id ?? ''}:${state.user?.tenant_id ?? ''}`,
  )
  return <ModelDiscoveryForm key={`${owner}:${props.provider}`} {...props} />
}

function ModelDiscoveryForm({ provider, close, configureManually }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [url, setUrl] = useState(
    provider === 'Ollama' ? 'http://127.0.0.1:11434' : '',
  )
  const [region, setRegion] = useState('')
  const [page, setPage] = useState<ModelDiscoveryPage>()
  const [selected, setSelected] = useState<Map<string, DiscoveredModel>>(
    new Map(),
  )
  const [phase, setPhase] = useState<
    'idle' | 'discovering' | 'verifying' | 'saving'
  >('idle')
  const [discoveryFailed, setDiscoveryFailed] = useState(false)
  const [failure, setFailure] = useState<'verify' | 'save'>()
  const [verified, setVerified] = useState(false)
  const mutation = useModelProviderMutation()
  const controller = useRef<AbortController | null>(null)
  const generation = useRef(0)
  useEffect(
    () => () => {
      generation.current += 1
      controller.current?.abort()
    },
    [],
  )
  const pending = phase !== 'idle'
  const invalidate = () => {
    setVerified(false)
    setFailure(undefined)
  }
  const credentialsChanged = (
    setter: (value: string) => void,
    value: string,
  ) => {
    generation.current += 1
    controller.current?.abort()
    setter(value)
    setPhase('idle')
    setPage(undefined)
    setSelected(new Map())
    setDiscoveryFailed(false)
    invalidate()
  }
  const begin = () => {
    controller.current?.abort()
    const abort = new AbortController()
    controller.current = abort
    const token = ++generation.current
    const owner = apiClient.captureOwner()
    return {
      signal: abort.signal,
      current: () =>
        owner() && token === generation.current && !abort.signal.aborted,
    }
  }
  const discover = async (number = 1, reset = false) => {
    const operation = begin()
    setPhase('discovering')
    setDiscoveryFailed(false)
    if (reset) setSelected(new Map())
    invalidate()
    try {
      const result = await modelProvidersAPI.discoverModels(
        provider,
        { api_key: key, base_url: url.trim(), region: region.trim() },
        number,
        operation.signal,
      )
      if (operation.current()) setPage(result)
    } catch {
      if (operation.current()) {
        setPage(undefined)
        setDiscoveryFailed(true)
      }
    } finally {
      if (operation.current()) setPhase('idle')
    }
  }
  const candidate = (): ConnectionCandidate => ({
    api_key: key,
    base_url: url.trim(),
    region: region.trim(),
    model_ids: [],
    custom_models: [...selected.values()].map(discoveredModelRegistration),
  })
  const verify = async () => {
    const operation = begin()
    setPhase('verifying')
    invalidate()
    try {
      await modelProvidersAPI.verifyConnection(
        provider,
        candidate(),
        operation.signal,
      )
      if (operation.current()) setVerified(true)
    } catch {
      if (operation.current()) setFailure('verify')
    } finally {
      if (operation.current()) setPhase('idle')
    }
  }
  const save = async () => {
    if (!name.trim() || !selected.size || !verified) return
    const operation = begin()
    setPhase('saving')
    setFailure(undefined)
    // Clear the variable captured by the mutation's operation once it settles.
    let payload: InstanceInput | undefined = {
      instance_name: name.trim(),
      ...candidate(),
    }
    try {
      await mutation.mutateAsync(async (isCurrent) => {
        if (!isCurrent() || !operation.current())
          throw new DOMException('Aborted', 'AbortError')
        await modelProvidersAPI.createInstance(
          provider,
          payload!,
          operation.signal,
        )
      })
      if (operation.current()) close()
    } catch {
      if (operation.current()) {
        setFailure('save')
        setVerified(false)
      }
    } finally {
      payload = undefined
      if (operation.current()) setPhase('idle')
    }
  }
  return (
    <Dialog open onOpenChange={(open) => !open && !pending && close()}>
      <DialogContent size="lg" modal>
        <DialogHeader>
          <DialogTitle>
            {t('settings.models.discovery.title', { provider })}
          </DialogTitle>
          <DialogDescription>
            {t('settings.models.discovery.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-col gap-space-base overflow-auto px-space-lg pb-space-lg">
          <fieldset disabled={pending} className="grid gap-space-sm">
            <Label htmlFor="discovery-instance-name">
              {t('settings.models.instances.name')}
            </Label>
            <Input
              id="discovery-instance-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                invalidate()
              }}
            />
            <Label htmlFor="discovery-key">
              {t('settings.models.instances.credential')}
            </Label>
            <Input
              id="discovery-key"
              type="password"
              autoComplete="new-password"
              value={key}
              onChange={(event) =>
                credentialsChanged(setKey, event.target.value)
              }
            />
            <Label htmlFor="discovery-url">
              {t('settings.models.instances.baseUrl')}
            </Label>
            <Input
              id="discovery-url"
              value={url}
              onChange={(event) =>
                credentialsChanged(setUrl, event.target.value)
              }
            />
            <Label htmlFor="discovery-region">
              {t('settings.models.instances.region')}
            </Label>
            <Input
              id="discovery-region"
              value={region}
              onChange={(event) =>
                credentialsChanged(setRegion, event.target.value)
              }
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void discover(1, true)}
            >
              {t('settings.models.discovery.find')}
            </Button>
          </fieldset>
          {selected.size > 0 && (
            <p role="status" className="text-sm text-text-secondary">
              {t('settings.models.discovery.selected', {
                count: selected.size,
              })}
            </p>
          )}
          {phase === 'discovering' ? (
            <PageLoadingState
              compact
              title={t('settings.models.discovery.loading')}
              description={null}
            />
          ) : discoveryFailed ? (
            <PageErrorState
              compact
              title={t('settings.models.discovery.failed')}
              description={null}
              retryLabel={t('common.retry')}
              onRetry={() => void discover(1, true)}
            />
          ) : page && !page.total ? (
            <PageEmptyState
              compact
              title={t('settings.models.discovery.empty')}
            />
          ) : page ? (
            <fieldset disabled={pending} className="flex flex-col gap-space-sm">
              <legend className="sr-only">
                {t('settings.models.discovery.find')}
              </legend>
              <ul className="max-h-64 overflow-auto rounded-radius-md border border-border-default">
                {page.items.map((model) => (
                  <li
                    key={model.model_name}
                    className="border-b border-border-subtle p-space-sm last:border-0"
                  >
                    <label className="flex cursor-pointer items-start gap-space-sm">
                      <Checkbox
                        aria-label={model.display_name}
                        checked={selected.has(model.model_name)}
                        disabled={
                          !selected.has(model.model_name) &&
                          selected.size >= 100
                        }
                        onCheckedChange={(checked) => {
                          setSelected((current) => {
                            const next = new Map(current)
                            if (checked === true)
                              next.set(model.model_name, model)
                            else next.delete(model.model_name)
                            return next
                          })
                          invalidate()
                        }}
                      />
                      <span className="min-w-0 text-sm break-words">
                        <span className="block font-medium">
                          {model.display_name}
                        </span>
                        <span className="block text-xs text-text-secondary">
                          {model.model_name}
                        </span>
                        <ModelCapabilities
                          types={model.model_types}
                          tools={model.is_tools}
                        />
                        {model.features.includes('thinking') && (
                          <span className="block text-xs text-text-secondary">
                            {t('settings.models.discovery.thinking')}
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              {page.total > page.page_size && (
                <nav
                  aria-label={t('settings.models.discovery.pagination')}
                  className="flex items-center justify-between gap-space-sm"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending || page.page <= 1}
                    onClick={() => void discover(page.page - 1)}
                  >
                    {t('settings.models.discovery.previous')}
                  </Button>
                  <span className="text-sm text-text-secondary">
                    {page.page} / {Math.ceil(page.total / page.page_size)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      pending || page.page * page.page_size >= page.total
                    }
                    onClick={() => void discover(page.page + 1)}
                  >
                    {t('common.next')}
                  </Button>
                </nav>
              )}
            </fieldset>
          ) : null}
          {verified && (
            <div role="status" className="text-sm">
              <p className="text-status-success">
                {t('settings.models.connection.valid')}
              </p>
              <p className="mt-space-xs text-xs text-text-secondary">
                {t('settings.models.connection.scope')}
              </p>
            </div>
          )}
          {failure && (
            <p role="alert" className="text-sm text-status-error">
              {t(
                failure === 'verify'
                  ? 'settings.models.connection.invalid'
                  : 'settings.models.connection.saveFailed',
              )}
            </p>
          )}
        </div>
        <DialogFooter>
          {configureManually && (
            <Button
              variant="ghost"
              onClick={configureManually}
              disabled={pending}
            >
              {t('settings.models.discovery.manual')}
            </Button>
          )}
          <Button variant="outline" onClick={close} disabled={pending}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="outline"
            onClick={() => void verify()}
            disabled={pending || !selected.size}
            loading={phase === 'verifying'}
          >
            {t('settings.models.connection.validate')}
          </Button>
          <Button
            onClick={() => void save()}
            disabled={pending || !name.trim() || !selected.size || !verified}
            loading={phase === 'saving'}
          >
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
