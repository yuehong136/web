import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ShareInputField } from './share-input-field'
import type {
  ShareFormValue,
  ShareFormValues,
  getShareInputEntries,
} from './utils'

type ShareInputEntry = ReturnType<typeof getShareInputEntries>[number]

interface ShareParameterDialogProps {
  open: boolean
  title?: string
  description?: string
  entries: ShareInputEntry[]
  values: ShareFormValues
  error?: string
  theme?: string | null
  disabled?: boolean
  /** persondata 候选项来源（分享页为 agent id） */
  workflowId?: string
  /** persondata 公开接口 beta token */
  betaToken?: string
  onOpenChange: (open: boolean) => void
  onChange: (key: string, value: ShareFormValue) => void
  onUpload: (key: string, files: FileList) => Promise<void>
  onSubmit: () => void
}

export function ShareParameterDialog({
  open,
  title,
  description,
  entries,
  values,
  error,
  theme,
  disabled,
  workflowId,
  betaToken,
  onOpenChange,
  onChange,
  onUpload,
  onSubmit,
}: ShareParameterDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" theme={theme} className="overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {title ?? t('agent.share.parameters', 'Run parameters')}
          </DialogTitle>
          <DialogDescription>
            {description ??
              t(
                'agent.share.parameterDialogDescription',
                'Fill Begin inputs to continue.',
              )}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[64vh] space-y-space-md overflow-auto px-space-lg pb-space-lg">
          {entries.map(({ key, field }) => (
            <ShareInputField
              key={key}
              fieldKey={key}
              field={field}
              value={values[key]}
              disabled={disabled}
              workflowId={workflowId}
              betaToken={betaToken}
              onChange={onChange}
              onUpload={onUpload}
            />
          ))}

          {error ? (
            <div className="rounded-radius-md border border-status-error-border bg-status-error-subtle p-space-sm text-sm text-status-error">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-space-sm">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={disabled}
            >
              {t('common.cancel', '取消')}
            </Button>
            <Button onClick={onSubmit} disabled={disabled}>
              {t('common.confirm', '确认')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
