import { useTranslation } from 'react-i18next'
import { SectionCard } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import DebugContent from '../../../debug-content'
import { FileUploadDirectUpload } from '../../../debug-content/uploader'
import type { BeginQuery } from '../../../types'
import { useCallback, useState } from 'react'
import { PipelineRuntimeStatus, type PipelineRuntimeController } from '../types'

interface PipelineRunPanelProps {
  controller: PipelineRuntimeController
}

export function PipelineRunPanel({ controller }: PipelineRunPanelProps) {
  const { t } = useTranslation()
  const {
    canvasId,
    beginInputs,
    handleRun,
    loading,
    saving,
    status,
    lastError,
  } = controller
  const [quickFiles, setQuickFiles] = useState<unknown[]>([])

  const handleQuickStart = useCallback(async () => {
    if (!Array.isArray(quickFiles) || quickFiles.length === 0) {
      return
    }

    const value: BeginQuery = {
      key: 'files',
      type: 'file',
      value: quickFiles as unknown as string,
      optional: false,
      name: t('agent.pipelineRun.runPanel.uploadDocument'),
    }
    await handleRun([value])
  }, [handleRun, quickFiles, t])

  if (beginInputs.length > 0) {
    return (
      <div className="space-y-space-lg p-space-md">
        <SectionCard
          title={t('agent.pipelineRun.runPanel.beginInputsTitle')}
          padding="default"
        >
          <div className="space-y-space-md">
            <p className="text-sm text-text-secondary">
              {t('agent.pipelineRun.runPanel.beginInputsHint')}
            </p>
            <DebugContent
              canvasId={canvasId}
              parameters={beginInputs}
              ok={handleRun}
              isNext={false}
              loading={loading || saving}
              btnText={
                loading
                  ? t('agent.pipelineRun.runPanel.running')
                  : t('agent.pipelineRun.runPanel.start')
              }
              className="min-h-0"
              maxHeight="max-h-none"
            />
          </div>
        </SectionCard>

        {status === PipelineRuntimeStatus.ERROR && lastError ? (
          <SectionCard
            title={t('agent.pipelineRun.runPanel.startFailed')}
            padding="default"
          >
            <p className="text-sm text-status-error">{lastError}</p>
          </SectionCard>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-space-lg p-space-md">
      <SectionCard
        title={t('agent.pipelineRun.runPanel.quickRunTitle')}
        padding="default"
      >
        <div className="space-y-space-md">
          <p className="text-sm text-text-secondary">
            {t('agent.pipelineRun.runPanel.quickRunHint')}
          </p>
          <FileUploadDirectUpload
            canvasId={canvasId}
            value={quickFiles}
            onChange={(value) =>
              setQuickFiles(Array.isArray(value) ? value : value ? [value] : [])
            }
            multiple
            maxFiles={5}
            buttonLabel={t('agent.pipelineRun.runPanel.selectSamples')}
          />
          <Button
            type="button"
            className="w-full"
            disabled={loading || saving || quickFiles.length === 0}
            onClick={handleQuickStart}
          >
            {loading
              ? t('agent.pipelineRun.runPanel.running')
              : t('agent.pipelineRun.runPanel.start')}
          </Button>
        </div>
      </SectionCard>

      {status === PipelineRuntimeStatus.ERROR && lastError ? (
        <SectionCard
          title={t('agent.pipelineRun.runPanel.startFailed')}
          padding="default"
        >
          <p className="text-sm text-status-error">{lastError}</p>
        </SectionCard>
      ) : null}
    </div>
  )
}
