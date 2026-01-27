/**
 * Real-time Tool Call Result Renderer
 * Displays tool calls with different status states and real-time updates
 */

import React, { useState } from 'react';
import {
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  Code,
  Zap,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loading } from '@/components/ui/loading';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ToolCallInfo } from './EnhancedSSEParser';

interface ToolCallRendererProps {
  toolCalls: ToolCallInfo[];
  isAnalyzing?: boolean;
  className?: string;
  showTimestamp?: boolean;
  collapsible?: boolean;
}

// 状态配置（使用语义令牌颜色）
const STATUS_CONFIG = {
  pending: {
    color: 'warning' as const,
    bgColor: 'var(--color-state-warning)',
    textColor: 'var(--color-components-badge-warning-text)',
    icon: Clock,
    text: '等待中',
    description: '工具调用已创建，等待执行'
  },
  running: {
    color: 'info' as const,
    bgColor: 'var(--color-state-focus)',
    textColor: 'var(--color-components-badge-info-text)',
    icon: PlayCircle,
    text: '执行中',
    description: '工具正在执行中...'
  },
  success: {
    color: 'success' as const,
    bgColor: 'var(--color-state-success)',
    textColor: 'var(--color-components-badge-success-text)',
    icon: CheckCircle,
    text: '成功',
    description: '工具调用执行成功'
  },
  error: {
    color: 'destructive' as const,
    bgColor: 'var(--color-state-error)',
    textColor: 'var(--color-components-badge-error-text)',
    icon: AlertCircle,
    text: '失败',
    description: '工具调用执行失败'
  }
};

// 格式化参数显示
const formatArguments = (args: Record<string, any>): string => {
  if (!args || Object.keys(args).length === 0) {
    return '{}';
  }

  try {
    return JSON.stringify(args, null, 2);
  } catch {
    return String(args);
  }
};

// 格式化结果显示
const formatResult = (result: any, status: string): React.ReactNode => {
  if (!result) {
    return status === 'running' ? (
      <div className="flex items-center space-x-2">
        <Loading size="sm" />
        <span style={{ color: 'var(--color-text-secondary)' }}>执行中...</span>
      </div>
    ) : (
      <span style={{ color: 'var(--color-text-secondary)' }}>暂无结果</span>
    );
  }

  if (typeof result === 'string') {
    // 检查是否是JSON字符串
    try {
      const parsed = JSON.parse(result);
      return (
        <div className="space-y-2">
          <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>结构化结果:</span>
          <pre className="p-2 rounded text-xs overflow-x-auto" style={{ background: 'var(--color-components-code-bg)' }}>
            {JSON.stringify(parsed, null, 2)}
          </pre>
        </div>
      );
    } catch {
      // 普通字符串结果
      if (result.length > 200) {
        return (
          <div className="space-y-2">
            <p className="line-clamp-3" style={{ color: 'var(--color-text-primary)' }}>
              {result}
            </p>
          </div>
        );
      } else {
        return <span style={{ color: 'var(--color-text-primary)' }}>{result}</span>;
      }
    }
  }

  // 对象或其他类型
  return (
    <pre
      className="p-2 rounded text-xs overflow-x-auto"
      style={{ background: 'var(--color-components-code-bg)' }}
    >
      {JSON.stringify(result, null, 2)}
    </pre>
  );
};

// 单个工具调用卡片
const ToolCallCard: React.FC<{
  toolCall: ToolCallInfo;
  showTimestamp: boolean;
  collapsible: boolean;
}> = ({ toolCall, showTimestamp, collapsible }) => {
  const [isOpen, setIsOpen] = useState(['running', 'error'].includes(toolCall.status));
  const statusConfig = STATUS_CONFIG[toolCall.status];
  const StatusIcon = statusConfig.icon;
  const shouldShowHeader = !(collapsible && toolCall.status !== 'running');

  const cardContent = (
    <div className="space-y-3">
      {/* 工具信息头部 */}
      {shouldShowHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4" style={{ color: 'var(--color-state-focus)' }} />
            <span className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>{toolCall.name}</span>
            <Badge variant={statusConfig.color === 'info' ? 'secondary' : statusConfig.color}>
              {statusConfig.text}
            </Badge>
          </div>
          {showTimestamp && (
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {toolCall.timestamp}
            </span>
          )}
        </div>
      )}

      {/* 参数部分 */}
      {Object.keys(toolCall.arguments).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-1">
            <Code className="h-4 w-4" style={{ color: 'var(--color-text-secondary)' }} />
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>参数:</span>
          </div>
          <pre
            className="p-2 rounded text-xs overflow-x-auto border-l-2"
            style={{
              background: 'var(--color-components-code-bg)',
              borderLeftColor: 'var(--color-state-focus)'
            }}
          >
            {formatArguments(toolCall.arguments)}
          </pre>
        </div>
      )}

      {/* 结果部分 */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1">
          <StatusIcon className="h-4 w-4" style={{ color: statusConfig.bgColor }} />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>结果:</span>
        </div>
        <div className="border-l-2 pl-3" style={{ borderLeftColor: 'var(--color-border-default)' }}>
          {toolCall.status === 'error' ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>执行失败</AlertTitle>
              <AlertDescription>
                {formatResult(toolCall.result, toolCall.status)}
              </AlertDescription>
            </Alert>
          ) : (
            <div
              className="p-2 rounded"
              style={{ background: 'var(--color-components-code-bg)' }}
            >
              {formatResult(toolCall.result, toolCall.status)}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (collapsible && toolCall.status !== 'running') {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div
            className="flex items-center justify-between p-3 cursor-pointer rounded-lg transition-colors hover:bg-[var(--color-surface-secondary)]"
            style={{
              background: 'var(--color-components-card-bg)',
              border: '1px solid var(--color-components-card-border)'
            }}
          >
            <div className="flex items-center space-x-2" style={{ color: 'var(--color-text-primary)' }}>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" style={{ color: 'var(--color-text-secondary)' }} />
              ) : (
                <ChevronRight className="h-4 w-4" style={{ color: 'var(--color-text-secondary)' }} />
              )}
              <StatusIcon className="h-4 w-4" style={{ color: statusConfig.bgColor }} />
              <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{toolCall.name}</span>
              <Badge variant={statusConfig.color === 'info' ? 'secondary' : statusConfig.color}>
                {statusConfig.text}
              </Badge>
            </div>
            {showTimestamp && (
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {toolCall.timestamp}
              </span>
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pl-6 pt-2">
            {cardContent}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Card
      className="transition-all duration-200"
      style={{
        background: 'var(--color-components-card-bg)',
        borderColor:
          toolCall.status === 'error'
            ? 'var(--color-state-error)'
            : toolCall.status === 'running'
            ? 'var(--color-state-focus)'
            : 'var(--color-components-card-border)'
      }}
    >
      <CardContent className="p-3">
        {cardContent}
      </CardContent>
    </Card>
  );
};

// 主组件
export const ToolCallRenderer: React.FC<ToolCallRendererProps> = ({
  toolCalls,
  isAnalyzing = false,
  className = '',
  showTimestamp = true,
  collapsible = false
}) => {
  if (!toolCalls || toolCalls.length === 0) {
    if (isAnalyzing) {
      return (
        <div className={`tool-call-renderer ${className}`}>
          <Card
            style={{
              background: 'var(--color-components-card-bg)',
              borderColor: 'var(--color-components-card-border)'
            }}
          >
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <Loading size="sm" />
                <span style={{ color: 'var(--color-text-secondary)' }}>正在分析工具需求...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`tool-call-renderer space-y-3 ${className}`}>
      {/* 工具调用统计 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Zap className="h-4 w-4" style={{ color: 'var(--color-state-focus)' }} />
          <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>工具调用 ({toolCalls.length})</span>
        </div>
        {isAnalyzing && (
          <div className="flex items-center space-x-2">
            <Loading size="sm" />
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>分析中...</span>
          </div>
        )}
      </div>

      {/* 工具调用列表 */}
      <div className="space-y-3">
        {toolCalls.map((toolCall) => (
          <ToolCallCard
            key={toolCall.id}
            toolCall={toolCall}
            showTimestamp={showTimestamp}
            collapsible={collapsible}
          />
        ))}
      </div>

      {/* 状态标签 */}
      <div
        className="flex flex-wrap gap-2 pt-2 border-t"
        style={{ borderColor: 'var(--color-border-default)' }}
      >
        {Object.entries(
          toolCalls.reduce((acc, call) => {
            acc[call.status] = (acc[call.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([status, count]) => {
          const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
          const StatusIcon = config.icon;
          return (
            <Badge
              key={status}
              variant={config.color === 'info' ? 'secondary' : config.color}
              className="flex items-center gap-1"
            >
              <StatusIcon className="h-3 w-3" />
              {config.text} ({count})
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default ToolCallRenderer;
