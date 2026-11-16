/**
 * 批量邀请成员对话框
 * 支持多邮箱输入、前端校验、逐条结果展示
 */

import { useCallback, useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Send } from 'lucide-react'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { BatchInviteResponse } from '@/types/team'
import { InviteResultsView } from './InviteResultsView'

interface BatchInviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvite: (emails: string[]) => Promise<BatchInviteResponse>
  isLoading?: boolean
}

type DialogPhase = 'input' | 'submitting' | 'results'
type InviteError = 'empty' | 'allInvalid' | 'failed' | null

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EXAMPLE = 'user1@example.com\nuser2@example.com'

/** 将输入文本解析为去重的邮箱列表 */
const parseEmails = (text: string): string[] => [
  ...new Set(
    text
      .split(/[\n,;]+/)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  ),
]

export function BatchInviteDialog({
  open,
  onOpenChange,
  onInvite,
  isLoading = false,
}: BatchInviteDialogProps) {
  const { t } = useTranslation()
  const fieldId = useId()
  const [input, setInput] = useState('')
  const [error, setError] = useState<InviteError>(null)
  const [phase, setPhase] = useState<DialogPhase>('input')
  const [results, setResults] = useState<BatchInviteResponse | null>(null)

  const parsedEmails = useMemo(() => parseEmails(input), [input])
  const invalidEmails = parsedEmails.filter((email) => !EMAIL_REGEX.test(email))
  const validCount = parsedEmails.length - invalidEmails.length

  const handleSubmit = useCallback(async () => {
    setError(null)
    if (parsedEmails.length === 0) return setError('empty')
    if (validCount === 0) return setError('allInvalid')
    setPhase('submitting')
    try {
      // The backend reports invalid addresses too, so send everything parsed.
      setResults(await onInvite(parsedEmails))
      setPhase('results')
    } catch {
      setError('failed')
      setPhase('input')
    }
  }, [parsedEmails, validCount, onInvite])

  const handleClose = useCallback(() => {
    setInput('')
    setError(null)
    setPhase('input')
    setResults(null)
    onOpenChange(false)
  }, [onOpenChange])

  const submitting = phase === 'submitting'

  return (
    <Dialog open={open} onOpenChange={(value) => !value && handleClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{t('settings.team.inviteDialog.title')}</DialogTitle>
          <DialogDescription>
            {t(
              phase === 'results'
                ? 'settings.team.inviteDialog.resultsDescription'
                : 'settings.team.inviteDialog.description',
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {phase === 'results' && results ? (
            <InviteResultsView
              results={results.results}
              summary={results.summary}
            />
          ) : (
            <div className="flex flex-col gap-space-sm">
              <Label htmlFor={fieldId}>
                {t('settings.team.inviteDialog.emails')}
              </Label>
              <Textarea
                id={fieldId}
                placeholder={EXAMPLE}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value)
                  setError(null)
                }}
                disabled={submitting}
                aria-invalid={error ? true : undefined}
                className="min-h-32 font-mono text-sm"
              />
              <p className="text-xs text-text-tertiary">
                {parsedEmails.length
                  ? t('settings.team.inviteDialog.recognized', {
                      count: parsedEmails.length,
                      invalid: invalidEmails.length,
                    })
                  : t('settings.team.inviteDialog.hint')}
              </p>
              {invalidEmails.length > 0 ? (
                <p className="rounded-radius-md border border-status-warning-border bg-status-warning-subtle px-space-sm py-space-xs text-xs break-all text-status-warning">
                  {t('settings.team.inviteDialog.invalidList', {
                    emails: invalidEmails.join(', '),
                  })}
                </p>
              ) : null}
              {error ? (
                <p role="alert" className="text-sm text-status-error">
                  {t(`settings.team.inviteDialog.errors.${error}`)}
                </p>
              ) : null}
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          {phase === 'results' ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setPhase('input')
                  setResults(null)
                }}
              >
                {t('settings.team.inviteDialog.inviteMore')}
              </Button>
              <Button onClick={handleClose}>
                {t('settings.team.inviteDialog.done')}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={submitting}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={() => void handleSubmit()}
                loading={submitting}
                disabled={submitting || isLoading || !parsedEmails.length}
              >
                {submitting ? null : (
                  <Send className="size-icon-sm" aria-hidden="true" />
                )}
                {validCount
                  ? t('settings.team.inviteDialog.sendCount', {
                      count: validCount,
                    })
                  : t('settings.team.inviteDialog.send')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
