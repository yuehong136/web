import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, MessageSquare, MoreHorizontal } from 'lucide-react'
import type { ChatSession } from '@/types/mcp'

interface ChatSidebarProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onSessionSelect: (id: string) => void
  onNewChat: () => void
  temporaryChatEnabled?: boolean
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewChat,
  temporaryChatEnabled = false,
}: ChatSidebarProps) {
  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div
        className="p-4"
        style={{
          borderBottom: '1px solid var(--color-components-sidebar-border)',
        }}
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500">
            <span className="text-xs text-white">M</span>
          </div>
          <div>
            <div className="font-medium">MCP实验场</div>
            <div className="text-xs text-muted-foreground">
              Powered by mc-agent
            </div>
          </div>
        </div>

        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          开启新对话
        </Button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2 px-2 text-xs text-muted-foreground">
          聊天一个大概意思实训问题的基本原理...
        </div>

        {/* 临时聊天模式提示 */}
        {temporaryChatEnabled && (
          <div className="mb-3 px-2">
            <div className="rounded border border-orange-200 bg-orange-50 px-2 py-1.5 text-xs text-orange-600 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
              📝 临时聊天模式已启用
            </div>
          </div>
        )}

        <div className="space-y-1">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className={`p-3 transition-colors ${
                temporaryChatEnabled
                  ? 'cursor-not-allowed bg-muted/30 opacity-50'
                  : `cursor-pointer hover:bg-state-hover ${
                      activeSessionId === session.id
                        ? 'bg-state-selected-bg'
                        : ''
                    }`
              }`}
              onClick={
                temporaryChatEnabled
                  ? undefined
                  : () => onSessionSelect(session.id)
              }
            >
              <div className="flex items-start gap-2">
                <MessageSquare
                  className={`mt-0.5 h-4 w-4 ${
                    temporaryChatEnabled
                      ? 'text-muted-foreground/50'
                      : 'text-muted-foreground'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={`truncate text-sm ${
                      temporaryChatEnabled ? 'text-muted-foreground' : ''
                    }`}
                  >
                    {session.title}
                  </div>
                  <div
                    className={`text-xs ${
                      temporaryChatEnabled
                        ? 'text-muted-foreground/50'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {session.timestamp}
                  </div>
                </div>
                <MoreHorizontal
                  className={`h-3 w-3 ${
                    temporaryChatEnabled
                      ? 'text-muted-foreground/50'
                      : 'text-muted-foreground'
                  }`}
                />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div
        className="p-4"
        style={{
          borderTop: '1px solid var(--color-components-sidebar-border)',
        }}
      >
        <div className="text-xs text-muted-foreground">会话设置</div>
      </div>
    </div>
  )
}
