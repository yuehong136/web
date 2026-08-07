import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import type { MCPServer } from '@/types/mcp'

type McpCardProps = {
  server: MCPServer
  selected: boolean
  onToggle: (id: string) => void
}

export function McpCard({ server, selected, onToggle }: McpCardProps) {
  return (
    <Card
      variant="interactive"
      padding="sm"
      className="gap-space-sm flex items-start justify-between"
      onClick={() => onToggle(server.id)}
    >
      <div className="space-y-1">
        <div className="text-sm font-medium text-text-primary">
          {server.name}
        </div>
        {server.description && (
          <div className="text-xs text-text-secondary">
            {server.description}
          </div>
        )}
        <div className="text-xs text-text-tertiary">
          {server.server_type} · {server.url}
        </div>
      </div>
      <Checkbox
        checked={selected}
        onCheckedChange={() => onToggle(server.id)}
        onClick={(event) => event.stopPropagation()}
      />
    </Card>
  )
}
