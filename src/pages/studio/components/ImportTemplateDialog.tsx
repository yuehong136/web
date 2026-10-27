import { useId, useRef, useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, FileJson, Upload, XCircle } from 'lucide-react'
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
import { useImportDialogApps } from '@/hooks/use-dialog-apps'
import type { DialogImportResult } from '@/types/api'

type FileIssue = 'fileType' | 'format' | 'app' | 'json' | 'result'
export function ImportTemplateDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const [file, setFile] = useState<File | null>(null)
  const [issue, setIssue] = useState<FileIssue | null>(null)
  const [result, setResult] = useState<DialogImportResult | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const validation = useRef(0)
  const mutation = useImportDialogApps()
  const close = () => {
    if (mutation.isPending) return
    validation.current += 1
    setFile(null)
    setIssue(null)
    setResult(null)
    mutation.reset()
    onClose()
  }
  const choose = async (next?: File) => {
    if (!next || mutation.isPending) return
    const sequence = ++validation.current
    setFile(null)
    setIssue(null)
    const name = next.name.toLowerCase()
    let error: FileIssue | null = null
    if (!name.endsWith('.json') && !name.endsWith('.zip')) error = 'fileType'
    else if (name.endsWith('.json')) {
      try {
        const parsed = JSON.parse(await next.text()) as {
          format?: unknown
          app?: unknown
        }
        if (parsed?.format !== 'multirag_dialog_template') error = 'format'
        else if (
          !parsed.app ||
          typeof parsed.app !== 'object' ||
          Array.isArray(parsed.app)
        )
          error = 'app'
      } catch {
        error = 'json'
      }
    }
    if (sequence !== validation.current) return
    setIssue(error)
    if (!error) {
      setFile(next)
      setResult(null)
      mutation.reset()
    }
  }
  const runImport = () => {
    if (!file || issue || mutation.isPending) return
    mutation.mutate(file, {
      onSuccess: (next) => {
        if (
          !next ||
          !Number.isFinite(next.total) ||
          next.total < 0 ||
          !Array.isArray(next.imported) ||
          !Array.isArray(next.failed) ||
          next.total !== next.imported.length + next.failed.length
        ) {
          setIssue('result')
          return
        }
        setResult(next)
      },
    })
  }
  const drop = (event: DragEvent) => {
    event.preventDefault()
    void choose(event.dataTransfer.files[0])
  }
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <DialogContent size="md" modal>
        <DialogHeader>
          <DialogTitle>{t('studio.importDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('studio.importDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div
          className="space-y-space-md overflow-y-auto p-space-lg"
          aria-busy={mutation.isPending}
        >
          <div
            onDrop={drop}
            onDragOver={(event) => event.preventDefault()}
            className="flex flex-col items-center gap-space-sm rounded-radius-lg border border-dashed border-border-default bg-background-subtle p-space-lg text-center"
          >
            <FileJson
              className="size-icon-xl text-text-tertiary"
              aria-hidden="true"
            />
            <p className="text-sm text-text-secondary">
              {t('studio.importDialog.dropHint')}
            </p>
            <Input
              ref={input}
              id={id}
              type="file"
              accept=".json,.zip"
              aria-label={t('studio.importDialog.chooseFile')}
              className="sr-only"
              tabIndex={-1}
              disabled={mutation.isPending}
              onChange={(event) => {
                void choose(event.target.files?.[0])
                event.target.value = ''
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={mutation.isPending}
              onClick={() => input.current?.click()}
            >
              {t('studio.importDialog.chooseFile')}
            </Button>
            {file && (
              <p className="max-w-full truncate text-sm font-medium text-text-primary">
                {file.name}
              </p>
            )}
          </div>
          {issue && (
            <p role="alert" className="text-sm text-status-error">
              {t(`studio.importDialog.validation.${issue}`)}
            </p>
          )}
          {mutation.isError && !result && (
            <p aria-live="polite" className="text-sm text-status-error">
              {t('studio.importDialog.retryHint')}
            </p>
          )}
          {result && (
            <div className="space-y-space-md" aria-live="polite">
              <p className="text-sm font-medium">
                {t('studio.importDialog.processed', { count: result.total })}
              </p>
              <p className="text-sm text-text-secondary">
                {t('studio.importDialog.summary', {
                  imported: result.imported.length,
                  failed: result.failed.length,
                })}
              </p>
              {result.imported.length > 0 && (
                <ul className="space-y-space-sm">
                  {result.imported.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-space-sm rounded-radius-md border border-border-subtle p-space-sm"
                    >
                      <CheckCircle2
                        className="size-icon-sm shrink-0 text-status-success"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-sm break-words">{item.name}</p>
                        {item.warnings?.length > 0 && (
                          <p className="text-xs text-text-secondary">
                            {t('studio.importDialog.warnings', {
                              count: item.warnings.length,
                            })}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {result.failed.length > 0 && (
                <>
                  <ul className="space-y-space-sm">
                    {result.failed.map((item, index) => (
                      <li
                        key={`${item.name}-${index}`}
                        className="flex items-start gap-space-sm rounded-radius-md border border-status-error-subtle p-space-sm"
                      >
                        <XCircle
                          className="size-icon-sm shrink-0 text-status-error"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="text-sm break-words">{item.name}</p>
                          <p className="text-xs text-status-error">
                            {t('studio.importDialog.failedItem')}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-text-secondary">
                    {t('studio.importDialog.partialHint')}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={close}
            disabled={mutation.isPending}
          >
            {t(result ? 'common.close' : 'common.cancel')}
          </Button>
          {(!result || result.imported.length === 0) && (
            <Button
              onClick={runImport}
              disabled={!file || Boolean(issue)}
              loading={mutation.isPending}
            >
              <Upload className="size-icon-sm" aria-hidden="true" />
              {t('studio.importDialog.submit')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
