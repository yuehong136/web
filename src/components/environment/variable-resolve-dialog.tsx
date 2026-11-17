import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/lib/toast'
import { copyToClipboard } from '@/lib/utils'
import type { ResolveResult } from './environment-variables'
import { ResolvedVariablesSummary } from './resolved-variables-summary'

interface VariableResolveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Resolves on the server for saved environments, locally for new ones. */
  onResolve: (text: string) => Promise<ResolveResult>
}

const EXAMPLE = 'https://{{server_ip}}:{{port}}/api'

/** Tries `{{name}}` references against the environment's variables. */
export function VariableResolveDialog({
  open,
  onOpenChange,
  onResolve,
}: VariableResolveDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{t('environment.resolve.title')}</DialogTitle>
        </DialogHeader>
        {/* Mounted per opening, so each test starts from an empty text. */}
        <VariableResolveBody onResolve={onResolve} />
      </DialogContent>
    </Dialog>
  )
}

function VariableResolveBody({
  onResolve,
}: Pick<VariableResolveDialogProps, 'onResolve'>) {
  const { t } = useTranslation()
  const id = useId()
  const [text, setText] = useState('')
  const [result, setResult] = useState<ResolveResult | null>(null)
  const [resolving, setResolving] = useState(false)

  const resolve = async () => {
    if (!text.trim()) return
    setResolving(true)
    try {
      setResult(await onResolve(text))
      toast.success(t('environment.resolve.done'))
    } catch {
      toast.error(t('environment.resolve.failed'))
      setResult(null)
    } finally {
      setResolving(false)
    }
  }

  const copyResult = async () => {
    if (!result?.resolved_text) return
    try {
      await copyToClipboard(result.resolved_text)
      toast.success(t('environment.resolve.copied'))
    } catch {
      toast.error(t('environment.resolve.copyFailed'))
    }
  }

  return (
    <DialogBody className="space-y-space-base">
      <div className="space-y-space-xs">
        <Label htmlFor={`${id}-text`}>{t('environment.resolve.input')}</Label>
        <Textarea
          id={`${id}-text`}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t('environment.resolve.placeholder', {
            example: EXAMPLE,
          })}
          className="min-h-20 font-mono"
          spellCheck={false}
        />
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <p className="text-xs text-text-tertiary">
            {t('environment.resolve.syntax')}{' '}
            <code className="rounded-radius-sm bg-components-code-bg px-space-2xs font-mono text-components-code-text">
              {`{{${t('environment.resolve.variableName')}}}`}
            </code>
          </p>
          <Button
            size="sm"
            onClick={resolve}
            loading={resolving}
            disabled={!text.trim()}
          >
            {t('environment.resolve.resolve')}
          </Button>
        </div>
      </div>

      {result ? (
        <section
          aria-live="polite"
          className="space-y-space-base border-t border-border-subtle pt-space-base"
        >
          <div className="space-y-space-xs">
            <div className="flex items-center justify-between gap-space-sm">
              <h3 className="text-sm font-medium text-text-primary">
                {t('environment.resolve.result')}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={copyResult}
                leftIcon={<Copy aria-hidden="true" />}
              >
                {t('environment.resolve.copy')}
              </Button>
            </div>
            <div className="rounded-radius-lg border border-border-subtle bg-background-subtle p-space-sm">
              <code className="font-mono text-sm break-all text-text-primary">
                {result.resolved_text}
              </code>
            </div>
          </div>
          <ResolvedVariablesSummary
            variablesUsed={result.variables_used}
            missingVariables={result.missing_variables}
          />
        </section>
      ) : null}
    </DialogBody>
  )
}
