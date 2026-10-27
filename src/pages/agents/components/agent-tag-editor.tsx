import { useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useFetchAgentTags,
  useUpdateAgentTags,
} from '@/hooks/use-agent-request'
import type { AgentFlow } from '@/types/agent'
import { splitAgentTags } from '../tag-utils'

export function AgentTagEditor({
  agent,
  onClose,
}: {
  agent: AgentFlow
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [tags, setTags] = useState(() => splitAgentTags(agent.tags))
  const [draft, setDraft] = useState('')
  const { data: allTags } = useFetchAgentTags()
  const { updateAgentTags, isLoading } = useUpdateAgentTags()
  const suggestions = allTags
    .filter(
      ({ tag }) =>
        !tags.some(
          (existing) => existing.toLowerCase() === tag.toLowerCase(),
        ) && tag.toLowerCase().startsWith(draft.trim().toLowerCase()),
    )
    .slice(0, 20)

  const withDraft = (values: string[], text: string) => {
    const tag = text.replaceAll(',', ' ').trim().slice(0, 64)
    return tag &&
      !values.some((existing) => existing.toLowerCase() === tag.toLowerCase())
      ? [...values, tag]
      : values
  }
  const addTag = (text: string) => {
    setTags((values) => withDraft(values, text))
    setDraft('')
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag(draft)
    } else if (event.key === 'Backspace' && !draft) {
      setTags((values) => values.slice(0, -1))
    }
  }
  const handleSave = async () => {
    try {
      await updateAgentTags({ agentId: agent.id, tags: withDraft(tags, draft) })
      onClose()
    } catch {
      // The mutation owns the safe, localized error feedback; keep the editor.
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('agents.editTags')}</DialogTitle>
          <DialogDescription>
            {t('agents.editTagsDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-space-md px-space-xl pb-space-lg">
          <div className="flex flex-wrap gap-space-xs">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-space-xs font-normal"
              >
                {tag}
                <button
                  type="button"
                  aria-label={t('agents.removeTag', { tag })}
                  disabled={isLoading}
                  onClick={() => setTags(tags.filter((value) => value !== tag))}
                >
                  <X className="size-icon-xs" />
                </button>
              </Badge>
            ))}
          </div>
          <Input
            aria-label={t('agents.tags')}
            placeholder={t('agents.tagsPlaceholder')}
            value={draft}
            disabled={isLoading}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <p className="text-xs text-text-secondary">{t('agents.tagLimit')}</p>
          {suggestions.length > 0 && (
            <div className="space-y-space-xs">
              <p className="text-xs text-text-secondary">
                {t('agents.tagSuggestions')}
              </p>
              <div className="flex flex-wrap gap-space-xs">
                {suggestions.map(({ tag }) => (
                  <Button
                    key={tag}
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => addTag(tag)}
                  >
                    + {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={isLoading} onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button disabled={isLoading} onClick={() => void handleSave()}>
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
