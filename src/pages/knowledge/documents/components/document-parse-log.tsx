import { useTranslation } from 'react-i18next'

/** Splits a parse log into plain parts and `[ERROR] …` lines. */
export function splitParseLog(text: string) {
  const clean = text.replace(/(\n)\1+/g, '$1')
  return clean
    .split(/(\[ERROR\].+)/g)
    .filter(Boolean)
    .map((part) => ({ text: part, error: part.startsWith('[ERROR]') }))
}

/** The backend's `progress_msg`, with error lines in the error colour. */
export function DocumentParseLog({ message }: { message?: string | null }) {
  const { t } = useTranslation()
  if (!message?.trim())
    return (
      <p className="text-sm text-fg-subtle">
        {t('knowledge.documents.inspector.noLog')}
      </p>
    )
  return (
    <pre
      data-slot="document-parse-log"
      className="max-h-80 overflow-y-auto rounded-radius-md bg-sunken p-space-sm font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-fg-muted"
    >
      {splitParseLog(message).map((part, index) =>
        part.error ? (
          <span key={index} className="text-danger-fg">
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </pre>
  )
}
