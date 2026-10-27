import { useState } from 'react'
import { Tag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useKnowledgeTags } from '@/hooks/use-knowledge-tags'

export function ChunkTagsPopover({ knowledgeIds }: { knowledgeIds: string[] }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const tags = useKnowledgeTags(knowledgeIds, open)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={!knowledgeIds.length}>
          <Tag className="size-icon-sm" />
          {t('knowledge.chunks.tags.title')}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 p-space-md"
        aria-label={t('knowledge.chunks.tags.title')}
      >
        <h3 className="mb-space-sm text-sm font-medium text-text-primary">
          {t('knowledge.chunks.tags.title')}
        </h3>
        <div className="max-h-64 overflow-y-auto" aria-busy={tags.isFetching}>
          {tags.isPending ? (
            <p role="status" className="text-sm text-text-caption">
              {t('knowledge.chunks.tags.loading')}
            </p>
          ) : tags.isError ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void tags.refetch()}
            >
              {t('knowledge.chunks.tags.retry')}
            </Button>
          ) : !tags.data.length ? (
            <p className="text-sm text-text-caption">
              {t('knowledge.chunks.tags.empty')}
            </p>
          ) : (
            <ul className="space-y-space-xs">
              {tags.data.map(({ value, count }) => (
                <li
                  key={value}
                  className="flex items-center justify-between gap-space-sm text-sm"
                >
                  <span className="min-w-0 break-words text-text-primary">
                    {value}
                  </span>
                  <span className="shrink-0 text-text-caption">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
