import { memo, useEffect, useState, type FC } from 'react'
// eslint-disable-next-line import-x/no-named-as-default -- DOMPurify exposes sanitize on its default browser instance.
import DOMPurify from 'dompurify'
import { FileText } from 'lucide-react'
import mammoth from 'mammoth'
import { useTranslation } from 'react-i18next'
import { ErrorState, LoadingState } from './preview-state'

const styleDocxHtml = (html: string): string => {
  return html
    .replace(/<p>/g, '<p class="mb-3 text-text-secondary leading-relaxed">')
    .replace(
      /<h1>/g,
      '<h1 class="text-2xl font-bold mt-6 mb-3 text-text-primary">',
    )
    .replace(
      /<h2>/g,
      '<h2 class="text-xl font-semibold mt-5 mb-2 text-text-primary">',
    )
    .replace(
      /<h3>/g,
      '<h3 class="text-lg font-semibold mt-4 mb-2 text-text-primary">',
    )
    .replace(
      /<h4>/g,
      '<h4 class="text-base font-semibold mt-4 mb-2 text-text-primary">',
    )
    .replace(
      /<h5>/g,
      '<h5 class="text-sm font-semibold mt-3 mb-2 text-text-primary">',
    )
    .replace(
      /<h6>/g,
      '<h6 class="text-sm font-medium mt-3 mb-2 text-text-primary">',
    )
    .replace(
      /<table>/g,
      '<table class="min-w-full border-collapse border border-border-default my-4">',
    )
    .replace(
      /<th>/g,
      '<th class="border border-border-default px-4 py-2 bg-background-surface text-left font-medium">',
    )
    .replace(/<td>/g, '<td class="border border-border-default px-4 py-2">')
    .replace(/<ul>/g, '<ul class="list-disc pl-6 mb-3">')
    .replace(/<ol>/g, '<ol class="list-decimal pl-6 mb-3">')
    .replace(/<li>/g, '<li class="mb-1">')
    .replace(/<a /g, '<a class="text-text-accent hover:underline" ')
    .replace(/<strong>/g, '<strong class="font-semibold text-text-primary">')
    .replace(/<em>/g, '<em class="italic">')
}

const DocxPreviewInner: FC<{
  arrayBuffer?: ArrayBuffer
  sourceUrl: string
}> = ({ arrayBuffer, sourceUrl }) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [htmlContent, setHtmlContent] = useState<string>('')

  useEffect(() => {
    let mounted = true

    const loadDocx = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!arrayBuffer) {
          throw new Error(t('knowledge.preview.documentPreviewFailed'))
        }

        const result = await mammoth.convertToHtml(
          { arrayBuffer },
          { includeDefaultStyleMap: true },
        )

        const sanitizedContent = DOMPurify.sanitize(
          styleDocxHtml(result.value),
          {
            USE_PROFILES: { html: true },
          },
        )

        if (mounted) {
          setHtmlContent(sanitizedContent)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          console.error('Docx preview error:', err)
          setError(
            err instanceof Error
              ? err.message
              : t('knowledge.preview.documentPreviewFailed'),
          )
          setLoading(false)
        }
      }
    }

    loadDocx()

    return () => {
      mounted = false
    }
  }, [arrayBuffer, t])

  if (loading) {
    return <LoadingState message={t('knowledge.preview.loadingDocument')} />
  }

  if (error) {
    return (
      <ErrorState
        icon={<FileText className="h-16 w-16" />}
        title={t('knowledge.preview.documentPreviewFailed')}
        message={error}
        url={sourceUrl}
      />
    )
  }

  return (
    <div className="h-full w-full overflow-auto bg-background-surface p-6">
      <div
        className="mx-auto max-w-4xl"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  )
}

export const DocxPreview = memo(DocxPreviewInner)
