import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import XMarkdown, {
  type ComponentProps,
  type XMarkdownProps,
} from '@ant-design/x-markdown'
import { Button } from '@/components/ui/button'
import { PageLoadingState, PageEmptyState } from '@/components/patterns'
import { FileKindTile } from '@/components/patterns/file-kind-tile'
import { SkillError, saveSkillBlob } from './skill-shared'

const WEB_LINK = /^https?:\/\//

/** Only web links stay clickable, and always in a new, unlinked tab. */
const SkillLink = ({
  href,
  children,
}: ComponentProps<{ href?: string; children?: ReactNode }>) => (
  <a
    href={href && WEB_LINK.test(href) ? href : undefined}
    target="_blank"
    rel="noopener noreferrer"
  >
    {children}
  </a>
)

// Skill files are untrusted: remote images are never fetched.
const NoImage = () => null
const COMPONENTS = { a: SkillLink, img: NoImage }
const STATIC = { hasNextChunk: false }
// Raw HTML is dropped, as before; `escapeRawHtml` keeps it inert regardless.
const SKIP_HTML: XMarkdownProps['config'] = { renderer: { html: () => '' } }

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
        <span className="flex min-w-0 items-center gap-space-sm text-sm break-all text-text-secondary">
          <FileKindTile name={path} size="sm" />
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
        <p className="text-sm text-text-secondary">{t('skills.binary')}</p>
      ) : markdown && !source ? (
        <article className="prose max-w-none break-words text-text-primary">
          <XMarkdown
            components={COMPONENTS}
            config={SKIP_HTML}
            streaming={STATIC}
            escapeRawHtml
          >
            {content.text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')}
          </XMarkdown>
        </article>
      ) : (
        <pre className="scroll-area max-h-[60vh] overflow-auto rounded-radius-lg bg-background-subtle p-space-base font-mono text-sm break-words whitespace-pre-wrap">
          {content.text}
        </pre>
      )}
    </div>
  )
}
