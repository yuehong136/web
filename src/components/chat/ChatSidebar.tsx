import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, MessageSquare, MoreHorizontal } from "lucide-react";
import type { ChatSession } from "@/types/mcp";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSessionSelect: (id: string) => void;
  onNewChat: () => void;
  temporaryChatEnabled?: boolean;
}

export function ChatSidebar({ 
  sessions, 
  activeSessionId, 
  onSessionSelect, 
  onNewChat,
  temporaryChatEnabled = false
}: ChatSidebarProps) {
  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-4" style={{ borderBottom: '1px solid var(--color-components-sidebar-border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white text-xs">M</span>
          </div>
          <div>
            <div className="font-medium">MCP实验场</div>
            <div className="text-xs text-muted-foreground">Powered by mc-agent</div>
          </div>
        </div>
        
        <Button 
          onClick={onNewChat}
          className="w-full justify-start gap-2" 
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          开启新对话
        </Button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="text-xs text-muted-foreground px-2 mb-2">
          聊天一个大概意思实训问题的基本原理...
        </div>
        
        {/* 临时聊天模式提示 */}
        {temporaryChatEnabled && (
          <div className="px-2 mb-3">
            <div className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400 px-2 py-1.5 rounded border border-orange-200 dark:border-orange-800">
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
                  ? 'opacity-50 cursor-not-allowed bg-muted/30'
                  : `cursor-pointer hover:bg-accent ${
                      activeSessionId === session.id ? 'bg-accent' : ''
                    }`
              }`}
              onClick={temporaryChatEnabled ? undefined : () => onSessionSelect(session.id)}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className={`w-4 h-4 mt-0.5 ${
                  temporaryChatEnabled ? 'text-muted-foreground/50' : 'text-muted-foreground'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm truncate ${
                    temporaryChatEnabled ? 'text-muted-foreground' : ''
                  }`}>
                    {session.title}
                  </div>
                  <div className={`text-xs ${
                    temporaryChatEnabled ? 'text-muted-foreground/50' : 'text-muted-foreground'
                  }`}>
                    {session.timestamp}
                  </div>
                </div>
                <MoreHorizontal className={`w-3 h-3 ${
                  temporaryChatEnabled ? 'text-muted-foreground/50' : 'text-muted-foreground'
                }`} />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="p-4" style={{ borderTop: '1px solid var(--color-components-sidebar-border)' }}>
        <div className="text-xs text-muted-foreground">会话设置</div>
      </div>
    </div>
  );
}