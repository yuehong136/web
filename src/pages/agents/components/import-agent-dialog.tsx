import { useId, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
interface ImportAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (payload: { title: string; file: File }) => Promise<void> | void
}
export function ImportAgentDialog({
  open,
  onOpenChange,
  onImport,
}: ImportAgentDialogProps) {
  const { t } = useTranslation()
  const id = useId()
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<'type' | 'failed' | null>(null)
  const close = () => {
    if (!submitting) {
      setTitle('')
      setFile(null)
      setError(null)
      onOpenChange(false)
    }
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!file || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await onImport({
        title: title.trim() || file.name.replace(/\.json$/i, ''),
        file,
      })
      setFile(null)
      setTitle('')
      onOpenChange(false)
    } catch {
      setError('failed')
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close()
      }}
    >
      <DialogContent size="md" modal>
        <DialogHeader>
          <DialogTitle>{t('agents.importJson')}</DialogTitle>
          <DialogDescription>
            {t('agents.importDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form
          id={id}
          onSubmit={(event) => {
            void submit(event)
          }}
          className="space-y-space-lg p-space-lg"
        >
          <div className="space-y-space-sm">
            <Label htmlFor={`${id}-name`}>
              {t('agents.importDialog.name')}
            </Label>
            <Input
              id={`${id}-name`}
              value={title}
              disabled={submitting}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t('agents.importDialog.namePlaceholder')}
            />
          </div>
          <div className="space-y-space-sm">
            <Label htmlFor={`${id}-file`}>
              {t('agents.importDialog.file')}
            </Label>
            <Input
              id={`${id}-file`}
              type="file"
              accept="application/json,.json"
              disabled={submitting}
              onChange={(event) => {
                const next = event.target.files?.[0]
                if (!next) return
                if (!next.name.toLowerCase().endsWith('.json')) {
                  setFile(null)
                  setError('type')
                } else {
                  setFile(next)
                  setError(null)
                }
              }}
            />
            {file && (
              <p className="text-sm break-words text-text-secondary">
                {file.name}
              </p>
            )}
          </div>
          {error && (
            <p role="alert" className="text-sm text-text-error">
              {t(
                error === 'type'
                  ? 'agents.importDialog.fileType'
                  : 'agents.importDialog.failed',
              )}
            </p>
          )}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form={id} loading={submitting} disabled={!file}>
            {t('agents.importDialog.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
