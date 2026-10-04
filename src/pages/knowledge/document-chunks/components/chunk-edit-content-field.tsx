import { useId } from 'react'
import { Code, Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Label } from '@/components/ui'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ChunkEditContentFieldProps {
  editingChunkContent: string
  onEditingChunkContentChange: (content: string) => void
  isMarkdownPreview: boolean
  onMarkdownPreviewChange: (preview: boolean) => void
}

export const ChunkEditContentField = ({
  editingChunkContent,
  onEditingChunkContentChange,
  isMarkdownPreview,
  onMarkdownPreviewChange,
}: ChunkEditContentFieldProps) => {
  const { t } = useTranslation()
  const contentId = useId()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={contentId}
          className="block text-sm font-medium text-text-secondary"
        >
          {t('knowledge.chunks.edit.content')}
        </Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMarkdownPreviewChange(!isMarkdownPreview)}
          className={cn(
            'flex items-center space-x-1 text-xs',
            isMarkdownPreview &&
              'border-border-accent bg-state-hover text-text-accent',
          )}
        >
          {isMarkdownPreview ? (
            <>
              <Code className="h-3 w-3" />
              <span>{t('knowledge.chunks.edit.edit')}</span>
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" />
              <span>{t('knowledge.chunks.edit.preview')}</span>
            </>
          )}
        </Button>
      </div>

      <div className="min-h-[200px]">
        {isMarkdownPreview ? (
          <div className="scrollbar-thin h-full min-h-[200px] w-full overflow-y-auto rounded-md border border-components-input-border bg-background-subtle px-4 py-3">
            <pre className="text-sm leading-relaxed break-words whitespace-pre-wrap text-text-secondary">
              {editingChunkContent}
            </pre>
          </div>
        ) : (
          <Textarea
            id={contentId}
            aria-label={t('knowledge.chunks.edit.content')}
            value={editingChunkContent}
            onChange={(event) =>
              onEditingChunkContentChange(event.target.value)
            }
            className="min-h-[200px] rounded-md px-3 py-2 font-mono leading-relaxed"
            placeholder={t('knowledge.chunks.edit.contentPlaceholder')}
          />
        )}
      </div>
    </div>
  )
}
