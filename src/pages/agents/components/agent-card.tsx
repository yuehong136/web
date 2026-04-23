import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatRelativeTime } from '@/lib/utils'
import { isPipelineFlow, resolveLocalizedText } from '@/lib/agent'
import type { AgentFlow } from '@/types/agent'
import {
  ArrowRight,
  Clock3,
  GitBranch,
  MoreHorizontal,
  Trash2,
} from 'lucide-react'

interface AgentCardProps {
  flow: AgentFlow
  onOpen: (flow: AgentFlow) => void
  onDelete: (flow: AgentFlow) => void
}

export function AgentCard({ flow, onOpen, onDelete }: AgentCardProps) {
  const title = resolveLocalizedText(flow.title, '未命名智能体')
  const description = resolveLocalizedText(flow.description, '阶段一骨架已接入，细节配置将继续补齐。')
  const pipeline = isPipelineFlow(flow)
  const nodeCount = flow.dsl.graph?.nodes.length || 0

  return (
    <Card
      variant="interactive"
      padding="default"
      className="flex h-full flex-col gap-space-md rounded-radius-xl"
      onClick={() => onOpen(flow)}
    >
      <div className="flex items-start justify-between gap-space-sm">
        <div className="flex min-w-0 items-center gap-space-sm">
          <Avatar className="h-11 w-11">
            {flow.avatar ? <AvatarImage src={flow.avatar} alt={title} /> : null}
            <AvatarFallback className="bg-state-info-subtle text-state-info">
              {title.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-text-primary">
              {title}
            </p>
            <p className="text-sm text-text-secondary">
              {pipeline ? 'Pipeline' : 'Agent'}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onOpen(flow)}>
              <ArrowRight className="mr-space-xs h-4 w-4" />
              打开编辑器
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-state-error focus:text-state-error"
              onClick={() => onDelete(flow)}
            >
              <Trash2 className="mr-space-xs h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="line-clamp-3 min-h-[60px] text-sm text-text-secondary">
        {description}
      </p>

      <div className="mt-auto flex items-center justify-between gap-space-sm border-t border-border-subtle pt-space-base text-sm text-text-tertiary">
        <span className="flex items-center gap-space-xs">
          <GitBranch className="h-4 w-4" />
          {nodeCount} 节点
        </span>
        <span className="flex items-center gap-space-xs">
          <Clock3 className="h-4 w-4" />
          {formatRelativeTime(flow.update_time)}
        </span>
      </div>
    </Card>
  )
}
