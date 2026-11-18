import { useTranslation } from 'react-i18next'
import { SectionCard } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Download, ExternalLink } from 'lucide-react'
import type { PipelineRuntimeController } from '../types'

interface PipelineOutputPanelProps {
  controller: PipelineRuntimeController
}

export function PipelineOutputPanel({ controller }: PipelineOutputPanelProps) {
  const { t } = useTranslation()
  const {
    outputAvailable,
    endOutput,
    lastError,
    uploadedFile,
    resultPath,
    handleDownloadOutput,
    handleOpenResult,
  } = controller

  return (
    <div className="space-y-space-lg p-space-md">
      <SectionCard
        title={t('agent.pipelineRun.outputPanel.title')}
        padding="default"
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenResult}
              disabled={!outputAvailable}
            >
              <ExternalLink className="mr-space-xs size-4" />
              {t('agent.pipelineRun.outputPanel.viewResult')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadOutput}
              disabled={!outputAvailable}
            >
              <Download className="mr-space-xs size-4" />
              {t('agent.pipelineRun.outputPanel.downloadJson')}
            </Button>
          </>
        }
      >
        {uploadedFile ? (
          <div className="mb-space-md rounded-radius-md border border-line-subtle bg-sunken p-space-sm text-sm text-fg-muted">
            <div className="font-medium text-fg">
              {String(
                uploadedFile.name ||
                  uploadedFile.id ||
                  t('agent.runtime.unnamedDocument'),
              )}
            </div>
            <div className="mt-space-xs text-xs text-fg-subtle">
              {resultPath
                ? t('agent.pipelineRun.outputPanel.resultReady')
                : t('agent.pipelineRun.outputPanel.resultMissingDocId')}
            </div>
          </div>
        ) : null}
        {outputAvailable ? (
          <pre className="max-h-[420px] overflow-auto rounded-radius-md bg-sunken p-space-sm text-xs">
            {JSON.stringify(endOutput, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-fg-muted">
            {t('agent.pipelineRun.outputPanel.empty')}
          </p>
        )}
      </SectionCard>

      {lastError ? (
        <SectionCard
          title={t('agent.pipelineRun.outputPanel.errorTitle')}
          padding="default"
        >
          <p className="text-sm text-danger-fg">{lastError}</p>
        </SectionCard>
      ) : null}
    </div>
  )
}
