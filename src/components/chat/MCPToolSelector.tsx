import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wrench, Search, Globe, Server, Loader2 } from 'lucide-react';
import { mcpAPI } from '@/api/mcp';
import { toast } from '@/lib/toast';
import type { MCPServer } from '@/types/mcp';

// 临时定义类型以避免导入问题
interface MCPChatConfig {
  mcp_ids: string[];
  mcp_timeout: number;
  verbose_tool_use: boolean;
}

export interface MCPToolSelectorProps {
  selectedMCPIds: string[];
  mcpConfig: MCPChatConfig;
  onMCPSelectionChange: (selectedIds: string[], config: MCPChatConfig) => void;
}

// 根据服务器类型获取图标
const getServerIcon = (serverType: string) => {
  switch (serverType) {
    case 'sse':
      return <Globe className="w-4 h-4" />;
    case 'streamable-http':
    case 'http':
      return <Server className="w-4 h-4" />;
    default:
      return <Wrench className="w-4 h-4" />;
  }
};

export function MCPToolSelector({ 
  selectedMCPIds, 
  mcpConfig, 
  onMCPSelectionChange 
}: MCPToolSelectorProps) {
  const [open, setOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<MCPChatConfig>(mcpConfig);
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedMCPIds);
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 加载MCP服务器列表
  useEffect(() => {
    if (open) {
      loadServers();
    }
  }, [open]);

  const loadServers = async () => {
    try {
      setLoading(true);
      const response = await mcpAPI.listServers({}, {
        page: 1,
        page_size: 100
      });
      
      setServers(response.mcp_servers || []);
    } catch (error) {
      toast.error('加载MCP服务器列表失败');
      console.error('Load MCP servers error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServerToggle = (serverId: string, enabled: boolean) => {
    if (enabled) {
      setLocalSelectedIds(prev => [...prev, serverId]);
    } else {
      setLocalSelectedIds(prev => prev.filter(id => id !== serverId));
    }
  };

  const handleConfigChange = (key: keyof MCPChatConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onMCPSelectionChange(localSelectedIds, {
      ...localConfig,
      mcp_ids: localSelectedIds
    });
    setOpen(false);
  };

  const handleCancel = () => {
    setLocalSelectedIds(selectedMCPIds);
    setLocalConfig(mcpConfig);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm" className="gap-2">
          <Wrench className="w-4 h-4" />
          MCP工具
          {selectedMCPIds.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedMCPIds.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            MCP工具配置
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索MCP服务器..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 服务器选择 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">可用服务器</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">加载中...</span>
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="grid gap-3">
                  {servers
                    .filter(server => 
                      !searchTerm || 
                      server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      server.description?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((server) => {
                      const isSelected = localSelectedIds.includes(server.id);
                      
                      return (
                        <Card 
                          key={server.id} 
                          className={`p-4 transition-all ${
                            isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex items-center gap-2 mt-1">
                                {getServerIcon(server.server_type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{server.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {server.server_type}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {server.description || '暂无描述'}
                                </p>
                                {server.url && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {server.url}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Switch
                              checked={isSelected}
                              onCheckedChange={(checked) => handleServerToggle(server.id, checked)}
                            />
                          </div>
                        </Card>
                      );
                    })}
                  {servers.length === 0 && !loading && (
                    <div className="text-center py-8 text-muted-foreground">
                      暂无可用的MCP服务器
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          <Separator />

          {/* 配置选项 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">高级配置</h3>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeout">超时时间 (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={localConfig.mcp_timeout}
                    onChange={(e) => handleConfigChange('mcp_timeout', parseInt(e.target.value))}
                    min={100}
                    max={30000}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="verbose">详细工具使用日志</Label>
                  <Switch
                    id="verbose"
                    checked={localConfig.verbose_tool_use}
                    onCheckedChange={(checked) => handleConfigChange('verbose_tool_use', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button onClick={handleSave}>
              保存配置
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}