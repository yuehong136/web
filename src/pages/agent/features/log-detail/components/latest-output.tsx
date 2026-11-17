import { Button } from '@/components/ui/button'
import { downloadJsonFile } from '@/lib/download'
import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { JsonViewer } from '../../../form/components/json-viewer'
import type { LogDetailViewModel } from '../types'

interface LatestOutputProps {
  output?: LogDetailViewModel['latestOutput']
}

export function LatestOutput({ output }: LatestOutputProps) {
  const { t } = useTranslation()

  if (!output) {
    return (
      <p className="text-sm text-text-secondary">
        {t('agent.runtimePanel.logDetail.noLatestOutput')}
      </p>
    )
  }

  return (
    <div className="space-y-space-sm">
      <div className="flex items-center justify-between gap-space-sm">
        <p className="text-sm font-medium text-text-primary">
          {t('agent.runtimePanel.logDetail.latestOutput')}
        </p>
        {output.kind === 'json' ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadJsonFile(output.value, 'agent-output.json')}
          >
            <Download className="size-4" />
            {t('agent.runtimePanel.logDetail.downloadJson')}
          </Button>
        ) : null}
      </div>
      {output.kind === 'json' ? (
        <JsonViewer data={output.value} />
      ) : (
        <pre className="max-h-[240px] overflow-auto rounded-radius-md bg-surface-secondary p-space-sm text-sm text-text-primary">
          {String(output.value)}
        </pre>
      )}
    </div>
  )
}
