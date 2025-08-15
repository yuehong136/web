import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ChevronDown, Cpu, Zap, Globe } from 'lucide-react';
import type { ModelInfo } from '@/types/mcp';

export interface ModelSelectorProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  temporaryChatEnabled: boolean;
  onTemporaryChatChange: (enabled: boolean) => void;
  className?: string;
}

// 模拟模型数据
const MOCK_MODELS: ModelInfo[] = [
  {
    id: 'qwen3-235b-a22b-2507',
    name: 'Qwen-3 235B',
    provider: 'Alibaba',
    description: '最新的通义千问大模型',
    maxTokens: 8192
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'OpenAI最新多模态模型',
    maxTokens: 128000
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Anthropic高性能模型',
    maxTokens: 200000
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    description: 'Google先进AI模型',
    maxTokens: 32768
  }
];

const getProviderIcon = (provider: string) => {
  switch (provider.toLowerCase()) {
    case 'openai':
      return <Zap className="w-4 h-4" />;
    case 'anthropic':
      return <Cpu className="w-4 h-4" />;
    case 'google':
      return <Globe className="w-4 h-4" />;
    default:
      return <Cpu className="w-4 h-4" />;
  }
};

export function ModelSelector({
  selectedModelId,
  onModelChange,
  temporaryChatEnabled,
  onTemporaryChatChange,
  className = ''
}: ModelSelectorProps) {
  const selectedModel = MOCK_MODELS.find(model => model.id === selectedModelId);

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* 模型选择器 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 min-w-[200px] justify-between">
            <div className="flex items-center gap-2">
              {selectedModel && getProviderIcon(selectedModel.provider)}
              <span className="font-medium">
                {selectedModel?.name || '选择模型'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="start" className="w-80">
          {MOCK_MODELS.map((model) => (
            <DropdownMenuItem
              key={model.id}
              onClick={() => onModelChange(model.id)}
              className="flex items-start gap-3 p-3"
            >
              <div className="flex items-center gap-2 mt-0.5">
                {getProviderIcon(model.provider)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{model.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {model.provider}
                  </Badge>
                  {model.id === selectedModelId && (
                    <Badge variant="default" className="text-xs">
                      当前
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {model.description}
                </p>
                <div className="text-xs text-muted-foreground mt-1">
                  最大令牌: {model.maxTokens?.toLocaleString()}
                </div>
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <div className="p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="temporary-chat" className="text-sm">
                临时聊天模式
              </Label>
              <Switch
                id="temporary-chat"
                checked={temporaryChatEnabled}
                onCheckedChange={onTemporaryChatChange}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              启用后聊天记录不会保存
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 状态显示 */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          在线
        </Badge>
        {temporaryChatEnabled && (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-900 dark:text-orange-200">
            临时模式
          </Badge>
        )}
      </div>
    </div>
  );
}