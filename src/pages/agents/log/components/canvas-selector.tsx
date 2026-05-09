import { useState } from 'react'
import { Bot, Check, ChevronsUpDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { resolveLocalizedText } from '@/lib/agent'
import { cn } from '@/lib/utils'
import { getAvatarGradient } from '@/components/ui/resource-list'
import type { AgentFlow } from '@/types/agent'
import { useCanvasPicker } from '../hooks/use-canvas-picker'

interface CanvasSelectorProps {
  selectedAgent?: AgentFlow
  selectedCanvasId?: string
  onSelect: (canvasId: string) => void
}

export function CanvasSelector({
  selectedAgent,
  selectedCanvasId,
  onSelect,
}: CanvasSelectorProps) {
  const [open, setOpen] = useState(false)
  const picker = useCanvasPicker()
  const title = selectedAgent
    ? resolveLocalizedText(selectedAgent.title, '未命名 Agent')
    : selectedCanvasId || '选择 Agent'
  const subtitle = selectedAgent ? '已发布 · 最近更新' : '选择后查看记录'
  const initial = title.charAt(0).toUpperCase()

  const handleSelect = (canvasId: string) => {
    onSelect(canvasId)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="px-space-xs h-9 min-w-[260px] justify-between"
        >
          <span className="gap-space-xs flex min-w-0 items-center">
            <span
              className={cn(
                'rounded-radius-sm flex h-6 w-6 shrink-0 items-center justify-center bg-gradient-to-br text-xs font-semibold text-text-inverted',
                getAvatarGradient(title),
              )}
            >
              {selectedAgent ? initial : <Bot className="h-3.5 w-3.5" />}
            </span>
            <span className="min-w-0 text-left">
              <span className="block truncate text-xs font-medium text-text-primary">
                {title}
              </span>
              <span className="block truncate text-[11px] font-normal text-text-tertiary">
                {subtitle}
              </span>
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 text-text-tertiary" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-space-sm w-[360px]">
        <Input
          type="search"
          inputSize="sm"
          placeholder="搜索 Agent"
          value={picker.keyword}
          onChange={(event) => picker.setKeyword(event.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
        <div className="mt-space-sm max-h-[320px] overflow-auto">
          <div className="mb-space-xs px-space-xs text-xs font-medium text-text-tertiary">
            {picker.keyword ? '搜索结果' : '最近更新'}
          </div>
          {(picker.keyword ? picker.agents : picker.recentAgents).map(
            (agent) => {
              const agentTitle = resolveLocalizedText(
                agent.title,
                '未命名 Agent',
              )
              const active = agent.id === selectedCanvasId
              return (
                <button
                  key={agent.id}
                  type="button"
                  className={cn(
                    'rounded-radius-md px-space-sm py-space-sm flex w-full items-center justify-between text-left transition-colors',
                    active
                      ? 'bg-components-card-bg-hover text-text-primary'
                      : 'hover:bg-surface-secondary text-text-secondary',
                  )}
                  onClick={() => handleSelect(agent.id)}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {agentTitle}
                    </span>
                    <span className="block truncate text-xs text-text-tertiary">
                      {agent.id}
                    </span>
                  </span>
                  {active ? (
                    <Check className="h-4 w-4 text-state-success" />
                  ) : null}
                </button>
              )
            },
          )}
          {!picker.isLoading && picker.agents.length === 0 ? (
            <div className="px-space-sm py-space-lg text-center text-sm text-text-tertiary">
              暂无匹配 Agent
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
