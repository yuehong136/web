import { useState } from 'react'
import { CircleCheck, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { GatewayCatalog, GatewayKeyCreated } from '@/api/model-gateway'
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
import { useFetchGatewayOverview } from '@/hooks/use-model-gateway-request'
import { downloadTextFile } from '@/lib/download'
import { callableModels, scopeOfKey } from '../catalog'
import {
  curlModelsSample,
  envSample,
  pythonSample,
  sampleModel,
} from '../samples'
import { PREFIX, formatInstant, resolveBaseUrl } from '../utils'
import { CodeSamples } from './code-samples'
import { CopyField } from './copy-field'

const MAX_CHIPS = 12

interface KeyCreatedDialogProps {
  /** Carries the one-time plaintext; it is never cached or stored. */
  created: GatewayKeyCreated
  /** The key was rotated: this is its new secret, not a new key. */
  rotated?: boolean
  catalog: GatewayCatalog
  onClose: () => void
}

/**
 * The only time the full key is shown: with the base URL, the models it can
 * call, ready-to-paste environment variables and samples, and a .env file.
 */
export function KeyCreatedDialog({
  created,
  rotated = false,
  catalog,
  onClose,
}: KeyCreatedDialogProps) {
  const { t } = useTranslation()
  const overview = useFetchGatewayOverview(7)
  const [saved, setSaved] = useState(false)
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
          <span className="flex size-9 shrink-0 items-center justify-center rounded-radius-full bg-success-soft text-success-fg">
            <CircleCheck className="size-icon-md" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <DialogTitle>
              {t(`${PREFIX}.created.${rotated ? 'rotatedTitle' : 'title'}`, {
                name: created.name,
              })}
            </DialogTitle>
            <DialogDescription>
              {t(`${PREFIX}.created.description`)}
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-space-lg">
          <div className="space-y-space-xs">
            <span className="text-sm font-medium text-fg">
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
              <span className="text-sm font-medium text-fg">
                {t(`${PREFIX}.created.baseUrl`)}
              </span>
              <CopyField
                value={baseUrl}
                copyLabel={t(`${PREFIX}.created.copyBaseUrl`)}
              />
            </div>
            <div className="min-w-0 space-y-space-xs">
              <span className="text-sm font-medium text-fg">{modelsTitle}</span>
              <ul className="flex flex-wrap gap-space-xs">
                {models.slice(0, MAX_CHIPS).map((model) => (
                  <li
                    key={model.model_id}
                    className="rounded-radius-sm bg-sunken px-space-xs font-mono text-xs text-fg"
                  >
                    {model.call_name}
                  </li>
                ))}
                {models.length > MAX_CHIPS ? (
                  <li className="px-space-xs text-xs text-fg-subtle">
                    {t(`${PREFIX}.keyForm.previewMore`, {
                      count: models.length - MAX_CHIPS,
                    })}
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
          <div className="rounded-radius-lg border border-line-subtle p-space-md">
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
          {rotated ? (
            <div
              role="note"
              className="rounded-radius-lg border border-warning-line bg-warning-soft p-space-md text-sm"
            >
              <p className="font-medium text-fg">
                {t(
                  created.previous_key_expires_at
                    ? `${PREFIX}.created.rotatedGrace`
                    : `${PREFIX}.created.rotatedNow`,
                  {
                    time:
                      formatInstant(created.previous_key_expires_at ?? null) ??
                      '',
                  },
                )}
              </p>
              <p className="text-fg-muted">
                {t(`${PREFIX}.created.rotatedHint`)}
              </p>
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
              className="font-normal text-fg-muted"
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
