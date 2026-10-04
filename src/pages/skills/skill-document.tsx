import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { PageLoadingState, PageEmptyState } from '@/components/patterns'
import { SkillError, saveSkillBlob } from './skill-shared'

/** Untrusted Markdown: no raw HTML, remote images, or executable links. */
export function SkillDocument({
  path,
  blob,
  error,
}: {
  path: string
  blob?: Blob
  error?: unknown
}) {
  const { t } = useTranslation()
  const [content, setContent] = useState<{
    blob: Blob
    text: string | null
  } | null>(null)
  const [source, setSource] = useState(false)
  useEffect(() => {
    let active = true
    if (blob)
      void blob.arrayBuffer().then((bytes) => {
        let text: string | null = null
        try {
          text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
          if (text.includes('\0')) text = null
        } catch {
          /* Binary files stay downloadable. */
        }
        if (active) setContent({ blob, text })
      })
    return () => {
      active = false
    }
  }, [blob])
  if (!path) return <PageEmptyState title={t('skills.chooseFile')} />
  if (error) return <SkillError error={error} />
  if (!blob || content?.blob !== blob)
    return (
      <PageLoadingState compact title={t('skills.loading')} description="" />
    )
  const markdown = /\.md$/i.test(path)
  return (
    <div className="flex min-h-0 flex-col gap-space-base">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <span className="min-w-0 text-sm break-all text-text-secondary">
          {path}
        </span>
        <div className="flex gap-space-sm">
          {markdown && (
            <Button variant="ghost" onClick={() => setSource(!source)}>
              {t(source ? 'skills.preview' : 'skills.sourceText')}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => saveSkillBlob(blob, path.split('/').pop() || 'file')}
          >
            {t('skills.downloadFile')}
          </Button>
        </div>
      </div>
      {content.text === null ? (
        <p>{t('skills.binary')}</p>
      ) : markdown && !source ? (
        <article className="prose max-w-none break-words text-text-primary">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            skipHtml
            components={{
              img: () => null,
              a: ({ href, children }) => (
                <a
                  href={
                    href?.startsWith('https://') || href?.startsWith('http://')
                      ? href
                      : undefined
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
            }}
          >
            {content.text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')}
          </ReactMarkdown>
        </article>
      ) : (
        <pre className="scroll-area max-h-[60vh] overflow-auto rounded-radius-lg bg-background-subtle p-space-base font-mono text-sm break-words whitespace-pre-wrap">
          {content.text}
        </pre>
      )}
    </div>
  )
}
