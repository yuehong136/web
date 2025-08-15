import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MCPToolSelector } from "./MCPToolSelector";
import { ChatModelSelector } from "./ChatModelSelector";
import { Settings, Menu } from "lucide-react";
import type { MyLLMProvider } from "@/stores/model";
// 临时定义类型以避免导入问题
interface MCPChatConfig {
  mcp_ids: string[];
  mcp_timeout: number;
  verbose_tool_use: boolean;
  mcp_react: boolean;
  mcp_max_rounds: number;
  mcp_parallelism: number;
}

interface ChatHeaderProps {
  onMenuToggle: () => void;
  isMobileMenuOpen: boolean;
  selectedMCPIds: string[];
  mcpConfig: MCPChatConfig;
  onMCPSelectionChange: (selectedIds: string[], config: MCPChatConfig) => void;
  selectedModelId?: string;
  onModelChange?: (modelId: string) => void;
  temporaryChatEnabled?: boolean;
  onTemporaryChatChange?: (enabled: boolean) => void;
  models?: MyLLMProvider;
  modelsLoading?: boolean;
}

export function ChatHeader({ 
  onMenuToggle, 
  isMobileMenuOpen, 
  selectedMCPIds, 
  mcpConfig, 
  onMCPSelectionChange,
  selectedModelId = "",
  onModelChange = () => {},
  temporaryChatEnabled = false,
  onTemporaryChatChange = () => {},
  models,
  modelsLoading = false
}: ChatHeaderProps) {
  return (
    <div className="border-b bg-background px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={onMenuToggle}
          >
            <Menu className="w-4 h-4" />
          </Button>
          
          {/* 模型选择器 */}
          {models && (
            <div className="hidden sm:block">
              <ChatModelSelector
                models={models}
                selectedModelName={selectedModelId}
                onSelect={(modelName) => onModelChange(modelName || '')}
                loading={modelsLoading}
                modelTypes={['chat', 'image2text']}
              />
            </div>
          )}
          
          {/* 移动端简化显示 */}
          <div className="sm:hidden flex items-center gap-2">
            <span className="font-medium text-sm">AI助手</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
              在线
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">自动MCP通信</span>
              <Switch 
                checked={selectedMCPIds.length > 0}
                disabled
                className="data-[disabled]:opacity-100"
              />
            </div>
          </div>
          
          <div className="hidden sm:block">
            <MCPToolSelector
              selectedMCPIds={selectedMCPIds}
              mcpConfig={mcpConfig}
              onMCPSelectionChange={onMCPSelectionChange}
            />
          </div>
          
          <div className="hidden md:flex items-center gap-2 text-sm">
            {selectedMCPIds.length > 0 ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  MCP工具已启用
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {selectedMCPIds.length}个服务器
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                未启用MCP工具
              </span>
            )}
          </div>
          
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}