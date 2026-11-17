import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { GatewayCatalog, GatewayOverview } from '@/api/model-gateway'
import { SectionCard } from '@/components/patterns'
import { badgeVariants } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  curlSample,
  nodeSample,
  pythonSample,
  sampleModel,
} from '../../samples'
import { PREFIX, resolveBaseUrl } from '../../utils'
import { CodeSamples } from '../code-samples'
import { CopyField } from '../copy-field'
import { StatusDot } from '../status-dot'

const ENDPOINTS = [
  'GET /v1/models',
  'POST /v1/chat/completions',
  'POST /v1/embeddings',
]

interface EndpointCardProps {
  overview: GatewayOverview
  catalog: GatewayCatalog
  onViewModels: () => void
}

/** Where to point an OpenAI-compatible client, with copyable samples. */
export function EndpointCard({
  overview,
  catalog,
  onViewModels,
}: EndpointCardProps) {
  const { t } = useTranslation()
  const baseUrl = resolveBaseUrl(overview) ?? ''
  const sample = {
    baseUrl,
    apiKey: t(`${PREFIX}.overview.sampleKey`),
    model: sampleModel(catalog),
    prompt: t(`${PREFIX}.overview.samplePrompt`),
  }
  const up = overview.data_plane === 'up'
  return (
    <SectionCard padding="none" aria-labelledby="gateway-endpoint-title">
      <div className="flex flex-wrap">
        <div className="flex min-w-0 flex-[1_1_22rem] flex-col gap-space-md p-space-lg">
          <div className="flex flex-wrap items-start justify-between gap-space-sm">
            <div className="min-w-0">
              <h2
                id="gateway-endpoint-title"
                className="text-base font-semibold text-text-primary"
              >
                {t(`${PREFIX}.overview.endpointTitle`)}
              </h2>
              <p className="mt-space-2xs text-sm text-text-secondary">
                {t(`${PREFIX}.overview.endpointHint`)}
              </p>
            </div>
            <StatusDot tone={up ? 'success' : 'error'}>
              {t(`${PREFIX}.overview.dataPlane.${up ? 'up' : 'down'}`)}
            </StatusDot>
          </div>
          <CopyField
            value={baseUrl}
            copyLabel={t(`${PREFIX}.overview.copyBaseUrl`)}
            data-testid="gateway-base-url"
          />
          <ul className="flex flex-wrap gap-space-xs">
            {ENDPOINTS.map((endpoint) => (
              <li
                key={endpoint}
                className={cn(
                  badgeVariants({ variant: 'secondary' }),
                  'font-mono',
                )}
              >
                {endpoint}
              </li>
            ))}
            <li className={badgeVariants({ variant: 'outline' })}>
              {t(`${PREFIX}.overview.rerankPlanned`)}
            </li>
          </ul>
          <div className="flex flex-wrap items-center gap-x-space-lg gap-y-space-xs text-sm text-text-secondary">
            <span>
              {t(`${PREFIX}.overview.providers`, {
                count: overview.counts.providers,
              })}
            </span>
            <span>
              {t(`${PREFIX}.overview.callableModels`, {
                count: overview.counts.callable_models,
              })}
            </span>
            <span>
              {t(`${PREFIX}.overview.activeKeys`, {
                count: overview.counts.active_keys,
              })}
            </span>
            <Button
              variant="link"
              size="sm"
              className="h-auto min-h-0 px-0 py-0"
              rightIcon={<ArrowRight className="size-icon-xs" aria-hidden />}
              onClick={onViewModels}
            >
              {t(`${PREFIX}.overview.viewModels`)}
            </Button>
          </div>
        </div>
        <div className="min-w-0 flex-[1_1_24rem] border-t border-border-subtle p-space-lg md:border-t-0 md:border-l">
          <CodeSamples
            label={t(`${PREFIX}.overview.samplesLabel`)}
            copyLabel={t(`${PREFIX}.overview.copySample`)}
            samples={[
              { id: 'python', label: 'Python', code: pythonSample(sample) },
              { id: 'curl', label: 'curl', code: curlSample(sample) },
              { id: 'node', label: 'Node.js', code: nodeSample(sample) },
            ]}
          />
        </div>
      </div>
    </SectionCard>
  )
}
