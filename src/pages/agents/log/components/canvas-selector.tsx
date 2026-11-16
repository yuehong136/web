import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bot, Check, ChevronsUpDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { isPipelineFlow, resolveLocalizedText } from '@/lib/agent'
import { cn } from '@/lib/utils'
import type { AgentFlow } from '@/types/agent'
import { useCanvasPicker } from '../hooks/use-canvas-picker'

interface CanvasSelectorProps {
  selectedAgent?: AgentFlow
  selectedCanvasId?: string
  onSelect: (canvasId: string) => void
}

/** Popover picker for the agent whose runs are shown. */
export function CanvasSelector({
  selectedAgent,
  selectedCanvasId,
  onSelect,
}: CanvasSelectorProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const picker = useCanvasPicker()
  const title = selectedAgent
    ? resolveLocalizedText(selectedAgent.title, t('agents.unnamedAgent'))
    : selectedCanvasId || t('agents.selectAgent')
  const agents = picker.keyword ? picker.agents : picker.recentAgents

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`${t('agents.runLogs.agent')}: ${title}`}
          className="max-w-full min-w-48 justify-between"
        >
          <span className="flex min-w-0 items-center gap-space-xs">
            <EntityAvatar
              name={selectedAgent ? title : undefined}
              src={selectedAgent?.avatar}
              seed={selectedAgent?.id}
              size="xs"
              icon={selectedAgent ? undefined : <Bot />}
              tone={selectedAgent ? 'auto' : 'neutral'}
            />
            <span className="min-w-0 truncate">{title}</span>
          </span>
          <ChevronsUpDown
            className="size-icon-sm text-text-tertiary"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-space-sm">
        <Input
          type="search"
          inputSize="sm"
          aria-label={t('agents.searchAgent')}
          placeholder={t('agents.searchAgent')}
          value={picker.keyword}
          onChange={(event) => picker.setKeyword(event.target.value)}
          leftIcon={<Search className="size-icon-sm" aria-hidden="true" />}
        />
        <p className="mt-space-sm px-space-xs py-space-xs text-xs font-medium text-text-tertiary">
          {picker.keyword
            ? t('agents.runLogs.searchResults')
            : t('agents.runLogs.recent')}
        </p>
        <ul className="flex max-h-80 flex-col gap-space-2xs overflow-auto">
          {agents.map((agent) => {
            const agentTitle = resolveLocalizedText(
              agent.title,
              t('agents.unnamedAgent'),
            )
            const active = agent.id === selectedCanvasId
            return (
              <li key={agent.id}>
                <button
                  type="button"
                  aria-current={active || undefined}
                  className={cn(
                    'flex w-full items-center gap-space-sm rounded-radius-md px-space-sm py-space-xs text-left text-sm outline-hidden focus-visible:ring-2 focus-visible:ring-state-focus',
                    active
                      ? 'bg-state-selected-bg text-text-primary'
                      : 'text-text-secondary hover:bg-state-hover hover:text-text-primary',
                  )}
                  onClick={() => {
                    onSelect(agent.id)
                    setOpen(false)
                  }}
                >
                  <EntityAvatar
                    name={agentTitle}
                    src={agent.avatar}
                    seed={agent.id}
                    size="sm"
                    badge={isPipelineFlow(agent) ? 'workflow' : 'agent'}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {agentTitle}
                    </span>
                    <span className="block truncate font-mono text-xs text-text-tertiary">
                      {agent.id}
                    </span>
                  </span>
                  {active ? (
                    <Check className="size-icon-sm" aria-hidden="true" />
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
        {!picker.isLoading && agents.length === 0 ? (
          <p className="px-space-sm py-space-lg text-center text-sm text-text-tertiary">
            {t('agents.runLogs.noAgents')}
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
