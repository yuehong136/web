import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { copyToClipboard } from '@/lib/utils'
import { Check, Copy } from 'lucide-react'

interface ShareOutputBlockProps {
  title: string
  description: string
  value: string
  emptyText: string
  copyLabel: string
  variant?: 'text' | 'html'
}

const copyFeedbackDuration = 1800

export function ShareOutputBlock({
  title,
  description,
  value,
  emptyText,
  copyLabel,
  variant = 'text',
}: ShareOutputBlockProps) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  const handleCopy = async () => {
    if (!value) {
      return
    }

    try {
      await copyToClipboard(value)
      setStatus('copied')
    } catch {
      setStatus('error')
    }

    window.setTimeout(() => setStatus('idle'), copyFeedbackDuration)
  }

  return (
    <section className="space-y-space-sm">
      <div className="space-y-space-xs">
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>

      <div className="rounded-radius-lg bg-surface-primary relative border border-border-default">
        <Button
          variant="outline"
          size="icon-sm"
          className="right-space-sm top-space-sm absolute z-10"
          onClick={() => void handleCopy()}
          disabled={!value}
          aria-label={copyLabel}
        >
          {status === 'copied' ? (
            <Check className="h-4 w-4 text-status-success" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>

        <pre className="p-space-base pr-space-2xl min-h-[128px] overflow-auto whitespace-pre-wrap break-all font-mono text-sm leading-relaxed text-text-primary">
          {value ? (
            variant === 'html' ? (
              <HighlightedHtml value={value} />
            ) : (
              value
            )
          ) : (
            <span className="text-text-tertiary">{emptyText}</span>
          )}
        </pre>

        {status !== 'idle' ? (
          <div className="gap-space-xs px-space-base py-space-sm flex items-center border-t border-border-subtle text-xs">
            {status === 'copied' ? (
              <>
                <Check className="h-3.5 w-3.5 text-status-success" />
                <span className="text-text-secondary">
                  {t('agent.share.copiedToClipboard', 'Copied to clipboard')}
                </span>
                <span className="text-text-tertiary">
                  {t('common.justNow', 'just now')}
                </span>
              </>
            ) : (
              <span className="text-status-error">
                {t('agent.share.copyFailedRetry', 'Copy failed. Try again.')}
              </span>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function HighlightedHtml({ value }: { value: string }) {
  return (
    <>
      {value.split('\n').map((line, index) => (
        <span key={`${line}-${index}`}>
          {highlightHtmlLine(line)}
          {index < value.split('\n').length - 1 ? '\n' : null}
        </span>
      ))}
    </>
  )
}

function highlightHtmlLine(line: string) {
  const segments = line.split(
    /(<\/?iframe|>|src=|style=|allow=|frameborder=|"[^"]*")/g,
  )

  return segments.map((segment, index) => {
    if (!segment) {
      return null
    }

    if (segment.startsWith('<') || segment === '>') {
      return (
        <span key={`${segment}-${index}`} className="text-status-error">
          {segment}
        </span>
      )
    }

    if (['src=', 'style=', 'allow=', 'frameborder='].includes(segment)) {
      return (
        <span key={`${segment}-${index}`} className="text-text-accent">
          {segment}
        </span>
      )
    }

    if (segment.startsWith('"http')) {
      return (
        <span key={`${segment}-${index}`} className="text-status-info">
          {segment}
        </span>
      )
    }

    return segment
  })
}
