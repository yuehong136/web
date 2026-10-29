import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useTranslation } from 'react-i18next'
import { ExternalLink, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { FACTORY_DOC_LINKS } from '../constants'
import type { ApiKeyModalProps } from './api-key-modal-utils'
import { ModelConfigurationHeader } from './model-configuration-header'
import { ProviderFormFields } from './provider-form-fields'
import {
  changeProviderDraft,
  createProviderDraft,
  isLocalProvider,
  type ProviderDraft,
} from './provider-form-schema'
import { useProviderFormActions } from './use-provider-form-actions'

export function ApiKeyModal(props: ApiKeyModalProps) {
  const owner = useAuthStore(
    (state) => `${state.user?.id ?? ''}:${state.user?.tenant_id ?? ''}`,
  )
  return props.isOpen ? (
    <ApiKeyModalForm
      key={`${owner}:${props.providerName}:${props.initialValues?.name ?? ''}`}
      {...props}
    />
  ) : null
}

function ApiKeyModalForm(props: ApiKeyModalProps) {
  const { t } = useTranslation()
  const { providerName: provider, initialValues, onClose } = props
  const [draft, setDraft] = useState(() =>
    createProviderDraft(provider, initialValues),
  )
  const [showKey, setShowKey] = useState(false)
  const [toolsChanged, setToolsChanged] = useState(false)
  const local = isLocalProvider(provider, props.isLocal)
  const actions = useProviderFormActions(props, draft, local, toolsChanged)
  const change = <K extends keyof ProviderDraft>(
    name: K,
    value: ProviderDraft[K],
  ) => {
    actions.invalidate()
    if (name === 'isTools') setToolsChanged(true)
    setDraft((current) => changeProviderDraft(current, name, value))
  }
  const paddle = provider === 'PaddleOCR'
  const title = paddle
    ? t('settings.models.paddleOCR.title')
    : local
      ? t(
          `settings.models.localModel.${initialValues ? 'editTitle' : 'addTitle'}`,
          { provider },
        )
      : t('settings.models.form.title', { provider })
  return (
    <Dialog open={props.isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md" modal closeOnOverlayClick={false}>
        <ModelConfigurationHeader
          provider={provider}
          title={title}
          description={t(
            paddle
              ? 'settings.models.paddleOCR.description'
              : 'settings.models.localModel.description',
          )}
        />
        <fieldset
          disabled={!!actions.busy}
          onChangeCapture={actions.invalidate}
          className="max-h-[calc(90vh-200px)] space-y-space-base overflow-y-auto px-space-lg py-space-base"
        >
          {typeof props.children === 'function'
            ? props.children(actions.invalidate)
            : props.children}
          <ProviderFormFields
            provider={provider}
            draft={draft}
            local={local}
            editing={!!initialValues}
            showKey={showKey}
            setShowKey={setShowKey}
            change={change}
          />
          {actions.error && (
            <p
              role="alert"
              className="rounded-radius-lg border border-status-error-border bg-status-error-subtle p-space-sm text-sm text-status-error"
            >
              {actions.error}
            </p>
          )}
          {actions.verified !== null && (
            <div
              role="status"
              className="space-y-space-xs rounded-radius-lg border border-border-subtle bg-background-subtle p-space-sm"
            >
              <p
                className={
                  actions.verified
                    ? 'text-sm text-status-success'
                    : 'text-sm text-status-error'
                }
              >
                {t(
                  `settings.models.connection.${actions.verified ? 'valid' : 'invalid'}`,
                )}
              </p>
              <p className="text-xs text-text-secondary">
                {t('settings.models.connection.scope')}
              </p>
            </div>
          )}
        </fieldset>
        <DialogFooter className="flex-col gap-space-base sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-space-base">
            {FACTORY_DOC_LINKS[provider] && (
              <a
                href={FACTORY_DOC_LINKS[provider]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-space-xs text-sm text-text-accent hover:underline"
              >
                {t('settings.models.paddleOCR.documentation')}
                <ExternalLink className="size-icon-xs" />
              </a>
            )}
            {props.onVerify && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => void actions.run('verify')}
                disabled={!!actions.busy}
              >
                <RefreshCcw
                  className={
                    actions.busy === 'verify'
                      ? 'size-icon-sm animate-spin'
                      : 'size-icon-sm'
                  }
                />
                {t('settings.models.connection.validate')}
              </Button>
            )}
          </div>
          <div className="flex gap-space-base">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={!!actions.busy}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => void actions.run('save')}
              disabled={!!actions.busy}
            >
              {t(
                actions.busy === 'save'
                  ? 'settings.models.paddleOCR.saving'
                  : 'common.save',
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
