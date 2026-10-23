import { Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

import { splitAgentTags } from '../tag-utils'

export function AgentTags({ tags }: { tags?: string }) {
  const list = splitAgentTags(tags)
  if (!list.length) return null
  return (
    <div className="flex flex-wrap gap-space-xs" data-testid="agent-tags">
      {list.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          title={tag}
          className="max-w-full gap-space-xs text-xs font-normal"
        >
          <Tag className="size-icon-xs shrink-0" aria-hidden="true" />
          <span className="truncate">{tag}</span>
        </Badge>
      ))}
    </div>
  )
}
