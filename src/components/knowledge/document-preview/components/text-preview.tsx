import { memo, useEffect, useState, type FC } from 'react'
import { FileCode } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import remarkGfm from 'remark-gfm'
import { fetchWithAuth, isAbortError } from '../utils'
import { ErrorState, LoadingState } from './preview-state'

const TextContent: FC<{
  url: string
  kind: 'txt' | 'md'
}> = ({ url, kind }) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    let mounted = true

    const loadContent = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetchWithAuth(url, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(
            t('knowledge.preview.fileLoadFailedWithStatus', {
              status: response.status,
            }),
          )
        }

        const text = await response.text()

        if (mounted) {
          setContent(text)
          setLoading(false)
        }
      } catch (err) {
        if (isAbortError(err)) return
        console.error(`${kind} load error:`, err)
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : t('knowledge.preview.loadFailed'),
          )
          setLoading(false)
        }
      }
    }

    loadContent()

    return () => {
      mounted = false
      controller.abort()
    }
  }, [kind, t, url])

  if (loading) {
    return (
      <LoadingState
        message={
          kind === 'md'
            ? t('knowledge.preview.loadingDocument')
            : t('knowledge.preview.loadingFile')
        }
      />
    )
  }

  if (error) {
    return (
      <ErrorState
        icon={<FileCode className="h-16 w-16" />}
        title={
          kind === 'md'
            ? t('knowledge.preview.documentLoadFailed')
            : t('knowledge.preview.fileLoadFailed')
        }
        message={error}
        url={url}
      />
    )
  }

  if (kind === 'md') {
    return (
      <div className="h-full w-full overflow-auto bg-background-surface p-6">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-auto bg-background-surface p-4">
      <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-text-secondary">
        {content}
      </pre>
    </div>
  )
}

const TxtPreviewInner: FC<{ url: string }> = ({ url }) => (
  <TextContent url={url} kind="txt" />
)

const MdPreviewInner: FC<{ url: string }> = ({ url }) => (
  <TextContent url={url} kind="md" />
)

export const TxtPreview = memo(TxtPreviewInner)
export const MdPreview = memo(MdPreviewInner)
