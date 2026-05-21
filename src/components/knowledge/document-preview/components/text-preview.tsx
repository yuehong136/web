import { memo, type FC } from 'react'
import { FileCode } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from 'react-i18next'
import remarkGfm from 'remark-gfm'
import { ErrorState } from './preview-state'

const TextContent: FC<{
  content?: string
  sourceUrl: string
  kind: 'txt' | 'md'
}> = ({ content, sourceUrl, kind }) => {
  const { t } = useTranslation()

  if (content === undefined) {
    return (
      <ErrorState
        icon={<FileCode className="h-16 w-16" />}
        title={
          kind === 'md'
            ? t('knowledge.preview.documentLoadFailed')
            : t('knowledge.preview.fileLoadFailed')
        }
        message={t('knowledge.preview.loadFailed')}
        url={sourceUrl}
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

const TxtPreviewInner: FC<{ content?: string; sourceUrl: string }> = ({
  content,
  sourceUrl,
}) => <TextContent content={content} sourceUrl={sourceUrl} kind="txt" />

const MdPreviewInner: FC<{ content?: string; sourceUrl: string }> = ({
  content,
  sourceUrl,
}) => <TextContent content={content} sourceUrl={sourceUrl} kind="md" />

export const TxtPreview = memo(TxtPreviewInner)
export const MdPreview = memo(MdPreviewInner)
