import { useState } from 'react'
import { CircleCheck, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
  GatewayCatalog,
  GatewayKey,
  GatewayKeyCreated,
} from '@/api/model-gateway'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  useFetchGatewayOverview,
  useRevokeGatewayKey,
} from '@/hooks/use-model-gateway-request'
import { downloadTextFile } from '@/lib/download'
import { getMutationErrorNotice } from '@/lib/mutation-error-feedback'
import { toast } from '@/lib/toast'
import { callableModels, scopeOfKey } from '../catalog'
import {
  curlModelsSample,
  envSample,
  pythonSample,
  sampleModel,
} from '../samples'
import { PREFIX, gatewayErrorKey, resolveBaseUrl } from '../utils'
import { CodeSamples } from './code-samples'
import { CopyField } from './copy-field'

const MAX_CHIPS = 12

interface KeyCreatedDialogProps {
  /** Carries the one-time plaintext; it is never cached or stored. */
  created: GatewayKeyCreated
  /** The key this one replaces, when it was issued by rotation. */
  rotatedFrom: GatewayKey | null
  catalog: GatewayCatalog
  onClose: () => void
}

/**
 * The only time the full key is shown: with the base URL, the models it can
 * call, ready-to-paste environment variables and samples, and a .env file.
 */
export function KeyCreatedDialog({
  created,
  rotatedFrom,
  catalog,
  onClose,
}: KeyCreatedDialogProps) {
  const { t } = useTranslation()
  const overview = useFetchGatewayOverview(7)
  const revokeMutation = useRevokeGatewayKey()
  const [saved, setSaved] = useState(false)
  const [oldRevoked, setOldRevoked] = useState(false)
  const baseUrl = resolveBaseUrl(overview.data) ?? ''
  const scope = scopeOfKey(created)
  const models = callableModels(catalog, scope)
  const sample = {
    baseUrl,
    apiKey: created.key,
    // A chat model this key can call, else any name from the catalog.
    model: sampleModel(models.length > 0 ? { models } : catalog),
    prompt: t(`${PREFIX}.overview.samplePrompt`),
  }

  const revokeOld = async () => {
    if (!rotatedFrom) return
    try {
      await revokeMutation.mutateAsync(rotatedFrom.id)
      setOldRevoked(true)
      toast.success(t(`${PREFIX}.created.oldRevoked`))
    } catch (error) {
      if (getMutationErrorNotice(error))
        toast.error(t(gatewayErrorKey(error, 'key')))
    }
  }

  let modelsTitle: string
  if (models.length === 0) modelsTitle = t(`${PREFIX}.created.noModels`)
  else
    modelsTitle = t(
      scope.allModels
        ? `${PREFIX}.created.modelsAll`
        : `${PREFIX}.created.models`,
      { count: models.length },
    )

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      {/* Closing needs a deliberate click: an accidental overlay click would
          lose the only copy of the key. */}
      <DialogContent size="lg" closeOnOverlayClick={false}>
        <DialogHeader className="flex flex-row items-start gap-space-md">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-radius-full bg-status-success-subtle text-status-success">
            <CircleCheck className="size-icon-md" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <DialogTitle>
              {t(`${PREFIX}.created.title`, { name: created.name })}
            </DialogTitle>
            <DialogDescription>
              {t(`${PREFIX}.created.description`)}
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-space-lg">
          <div className="space-y-space-xs">
            <span className="text-sm font-medium text-text-primary">
              {t(`${PREFIX}.created.key`)}
            </span>
            <CopyField
              emphasis
              value={created.key}
              copyLabel={t(`${PREFIX}.created.copyKey`)}
              data-testid="revealed-key"
            />
          </div>
          <div className="grid gap-space-md sm:grid-cols-2">
            <div className="min-w-0 space-y-space-xs">
              <span className="text-sm font-medium text-text-primary">
                {t(`${PREFIX}.created.baseUrl`)}
              </span>
              <CopyField
                value={baseUrl}
                copyLabel={t(`${PREFIX}.created.copyBaseUrl`)}
              />
            </div>
            <div className="min-w-0 space-y-space-xs">
              <span className="text-sm font-medium text-text-primary">
                {modelsTitle}
              </span>
              <ul className="flex flex-wrap gap-space-xs">
                {models.slice(0, MAX_CHIPS).map((model) => (
                  <li
                    key={model.model_id}
                    className="rounded-radius-sm bg-background-subtle px-space-xs font-mono text-xs text-text-primary"
                  >
                    {model.call_name}
                  </li>
                ))}
                {models.length > MAX_CHIPS ? (
                  <li className="px-space-xs text-xs text-text-tertiary">
                    {t(`${PREFIX}.keyForm.previewMore`, {
                      count: models.length - MAX_CHIPS,
                    })}
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
          <div className="rounded-radius-lg border border-border-subtle p-space-md">
            <CodeSamples
              label={t(`${PREFIX}.created.methodLabel`)}
              copyLabel={t(`${PREFIX}.created.copySample`)}
              samples={[
                {
                  id: 'env',
                  label: t(`${PREFIX}.created.methods.env`),
                  code: envSample(sample).trimEnd(),
                  note: t(`${PREFIX}.created.envHint`),
                },
                {
                  id: 'python',
                  label: t(`${PREFIX}.created.methods.python`),
                  code: pythonSample(sample),
                },
                {
                  id: 'curl',
                  label: t(`${PREFIX}.created.methods.curl`),
                  code: curlModelsSample(sample),
                },
              ]}
            />
          </div>
          {rotatedFrom ? (
            <div className="flex flex-wrap items-center gap-space-md rounded-radius-lg border border-status-warning-border bg-status-warning-subtle p-space-md">
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium text-text-primary">
                  {t(`${PREFIX}.created.rotateTitle`, {
                    name: rotatedFrom.name,
                  })}
                </p>
                <p className="text-text-secondary">
                  {t(`${PREFIX}.created.rotateHint`)}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                loading={revokeMutation.isPending}
                disabled={oldRevoked || revokeMutation.isPending}
                onClick={() => void revokeOld()}
              >
                {t(
                  oldRevoked
                    ? `${PREFIX}.created.oldRevoked`
                    : `${PREFIX}.created.revokeOld`,
                )}
              </Button>
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter className="justify-between">
          <div className="flex items-center gap-space-sm">
            <Checkbox
              id="gateway-key-saved"
              checked={saved}
              onCheckedChange={(checked) => setSaved(checked === true)}
            />
            <Label
              htmlFor="gateway-key-saved"
              className="font-normal text-text-secondary"
            >
              {t(`${PREFIX}.created.saved`)}
            </Label>
          </div>
          <div className="flex gap-space-sm">
            <Button
              type="button"
              variant="outline"
              leftIcon={
                <Download className="size-icon-sm" aria-hidden="true" />
              }
              onClick={() =>
                downloadTextFile(envSample(sample), '.env', 'text/plain')
              }
            >
              {t(`${PREFIX}.created.download`)}
            </Button>
            <Button type="button" onClick={onClose}>
              {t(`${PREFIX}.created.done`)}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
