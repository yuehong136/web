import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
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

enum ToolType {
  Common = 'common',
  MCP = 'mcp',
}

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
        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed border-border-default"
        >
          <Plus className="size-4" />
          {t('flow.addTools', 'Add Tools')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-space-md" align="start">
        <Tabs defaultValue={ToolType.Common} className="space-y-space-sm">
          <TabsList>
            <TabsTrigger value={ToolType.Common}>
              {t('flow.builtIn', 'Built-in')}
            </TabsTrigger>
            <TabsTrigger value={ToolType.MCP}>MCP</TabsTrigger>
          </TabsList>

          <TabsContent value={ToolType.Common}>
            <BuiltInToolCommand
              selectedToolNames={selectedToolNames}
              onSelect={toggleTool}
            />
          </TabsContent>

          <TabsContent value={ToolType.MCP}>
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
