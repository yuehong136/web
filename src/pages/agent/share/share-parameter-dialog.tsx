import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ShareInputField } from './share-input-field'
import type { ShareFormValue, ShareFormValues, getShareInputEntries } from './utils'

type ShareInputEntry = ReturnType<typeof getShareInputEntries>[number]

interface ShareParameterDialogProps {
  open: boolean
  title?: string
  description?: string
  entries: ShareInputEntry[]
  values: ShareFormValues
  error?: string
  disabled?: boolean
  onOpenChange: (open: boolean) => void
  onChange: (key: string, value: ShareFormValue) => void
  onUpload: (key: string, files: FileList) => Promise<void>
  onSubmit: () => void
}

export function ShareParameterDialog({
  open,
  title = '运行参数',
  description = '填写 Begin inputs 后继续运行。',
  entries,
  values,
  error,
  disabled,
  onOpenChange,
  onChange,
  onUpload,
  onSubmit,
}: ShareParameterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[64vh] space-y-space-md overflow-auto px-space-lg pb-space-lg">
          {entries.map(({ key, field }) => (
            <ShareInputField
              key={key}
              fieldKey={key}
              field={field}
              value={values[key]}
              disabled={disabled}
              onChange={onChange}
              onUpload={onUpload}
            />
          ))}

          {error ? (
            <div className="rounded-radius-md border border-status-error bg-surface-secondary p-space-sm text-sm text-status-error">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-space-sm">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={disabled}
            >
              取消
            </Button>
            <Button onClick={onSubmit} disabled={disabled}>
              确认
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
