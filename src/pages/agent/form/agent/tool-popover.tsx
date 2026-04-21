import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { RAGFlowNodeType } from '../../types'
import { useAgentToolActions, useAgentToolState } from './tool-hooks'
import { BuiltInToolCommand, McpToolCommand } from './tool-command'

interface AgentToolPopoverProps {
  node?: RAGFlowNodeType
}

export function AgentToolPopover({ node }: AgentToolPopoverProps) {
  const { t } = useTranslation()
  const { tools, mcp } = useAgentToolState(node)
  const { toggleTool, setMcpIds } = useAgentToolActions(node)

  const selectedToolNames = useMemo(
    () => new Set(tools.map((item) => item.component_name)),
    [tools],
  )
  const selectedMcpIdList = useMemo(
    () =>
      mcp
        .map((item) => item?.mcp_id)
        .filter((value): value is string => typeof value === 'string'),
    [mcp],
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          {t('flow.addTools', 'Add Tools')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-space-sm" align="start">
        <Tabs defaultValue="built-in" className="space-y-space-sm">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="built-in">
              {t('flow.builtIn', 'Built-in')}
            </TabsTrigger>
            <TabsTrigger value="mcp">MCP</TabsTrigger>
          </TabsList>

          <TabsContent value="built-in">
            <BuiltInToolCommand
              selectedToolNames={selectedToolNames}
              onSelect={toggleTool}
            />
          </TabsContent>

          <TabsContent value="mcp">
            <McpToolCommand
              selectedMcpIdList={selectedMcpIdList}
              onChange={setMcpIds}
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
