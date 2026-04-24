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
  ChevronRight,
  ChevronDown,
  Terminal,
  Zap,
} from 'lucide-react';
import { CodeHighlighter } from '@ant-design/x';
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

const STATUS_CONFIG = {
  pending: {
    color: 'warning' as const,
    bgColor: 'var(--color-state-warning)',
    icon: Clock,
    text: '等待中',
  },
  running: {
    color: 'info' as const,
    bgColor: 'var(--color-state-focus)',
    icon: PlayCircle,
    text: '执行中',
  },
  success: {
    color: 'success' as const,
    bgColor: 'var(--color-state-success)',
    icon: CheckCircle,
    text: '成功',
  },
  error: {
    color: 'destructive' as const,
    bgColor: 'var(--color-state-error)',
    icon: AlertCircle,
    text: '失败',
  },
};

const detectLang = (content: string): string => {
  const t = content.trim();
  if (/^\s*(WITH|SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|EXPLAIN)\b/i.test(t)) return 'sql';
  try {
    JSON.parse(t);
    return 'json';
  } catch { /* ignore */ }
  return 'plaintext';
};

const ParamValue: React.FC<{ value: any }> = ({ value }) => {
  if (value === null || value === undefined) {
    return (
      <span className="text-xs italic" style={{ color: 'var(--color-text-disabled)' }}>
        null
      </span>
    );
  }
  if (typeof value === 'boolean') {
    return (
      <span
        className="text-xs font-mono px-1.5 py-0.5 rounded"
        style={{
          background: 'var(--color-components-badge-info-bg)',
          color: 'var(--color-components-badge-info-text)',
        }}
      >
        {String(value)}
      </span>
    );
  }
  if (typeof value === 'number') {
    return (
      <span className="text-xs font-mono" style={{ color: 'var(--color-text-accent)' }}>
        {value}
      </span>
    );
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        return <CodeHighlighter lang="json">{JSON.stringify(parsed, null, 2)}</CodeHighlighter>;
      }
    } catch { /* ignore */ }
    const lang = detectLang(value);
    if (lang !== 'plaintext' || value.length > 80 || value.includes('\n')) {
      return <CodeHighlighter lang={lang}>{value}</CodeHighlighter>;
    }
    return (
      <span className="text-sm font-mono break-all" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </span>
    );
  }
  return <CodeHighlighter lang="json">{JSON.stringify(value, null, 2)}</CodeHighlighter>;
};

const ParamsList: React.FC<{ args: Record<string, any> }> = ({ args }) => {
  const entries = Object.entries(args);
  if (entries.length === 0) return null;
  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="space-y-1">
          <span
            className="inline-block text-xs font-mono font-medium px-1.5 py-0.5 rounded"
            style={{
              background: 'var(--color-components-badge-warning-bg)',
              color: 'var(--color-components-badge-warning-text)',
            }}
          >
            {key}
          </span>
          <div className="pl-2">
            <ParamValue value={value} />
          </div>
        </div>
      ))}
    </div>
  );
};

const ResultContent: React.FC<{ result: any; status: string }> = ({ result, status }) => {
  if (!result) {
    if (status === 'running') {
      return (
        <div className="flex items-center gap-2">
          <Loading size="sm" />
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            执行中...
          </span>
        </div>
      );
    }
    return (
      <span className="text-xs" style={{ color: 'var(--color-text-disabled)' }}>
        暂无结果
      </span>
    );
  }

  if (typeof result === 'string') {
    try {
      const parsed = JSON.parse(result);
      if (typeof parsed === 'object' && parsed !== null) {
        const entries = Object.entries(parsed);
        if (entries.length > 0 && entries.length <= 20) {
          return <ParamsList args={parsed} />;
        }
        return <CodeHighlighter lang="json">{JSON.stringify(parsed, null, 2)}</CodeHighlighter>;
      }
    } catch { /* ignore */ }
    const lang = detectLang(result);
    if (lang !== 'plaintext' || result.includes('\n') || result.length > 100) {
      return <CodeHighlighter lang={lang}>{result}</CodeHighlighter>;
    }
    return (
      <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
        {result}
      </span>
    );
  }

  if (typeof result === 'object' && result !== null) {
    const entries = Object.entries(result);
    if (entries.length > 0 && entries.length <= 20) {
      return <ParamsList args={result} />;
    }
    return <CodeHighlighter lang="json">{JSON.stringify(result, null, 2)}</CodeHighlighter>;
  }

  return (
    <span className="text-sm font-mono" style={{ color: 'var(--color-text-primary)' }}>
      {String(result)}
    </span>
  );
};

const ToolCallCard: React.FC<{
  toolCall: ToolCallInfo;
  showTimestamp: boolean;
  collapsible: boolean;
}> = ({ toolCall, showTimestamp, collapsible }) => {
  const [isOpen, setIsOpen] = useState(['running', 'error'].includes(toolCall.status));
  const statusConfig = STATUS_CONFIG[toolCall.status];
  const StatusIcon = statusConfig.icon;
  const hasParams = Object.keys(toolCall.arguments).length > 0;
  const hasResult = !!toolCall.result;
  const hasBody = hasParams || hasResult || toolCall.status === 'running';

  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {collapsible && hasBody && (
          isOpen
            ? <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
            : <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
        )}
        <StatusIcon className="h-4 w-4 shrink-0" style={{ color: statusConfig.bgColor }} />
        <span className="font-mono font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
          {toolCall.name}
        </span>
        <Badge
          variant={statusConfig.color === 'info' ? 'secondary' : statusConfig.color}
          className="text-xs"
        >
          {statusConfig.text}
        </Badge>
      </div>
      {showTimestamp && (
        <span className="text-xs shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
          {toolCall.timestamp}
        </span>
      )}
    </div>
  );

  const bodyContent = hasBody ? (
    <div
      className="px-3 py-3 space-y-3 border-t"
      style={{
        borderColor: 'var(--color-components-card-border)',
        background: 'var(--color-surface-secondary)',
      }}
    >
      {hasParams && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5" style={{ color: 'var(--color-text-secondary)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              参数
            </span>
          </div>
          <div className="pl-4">
            <ParamsList args={toolCall.arguments} />
          </div>
        </div>
      )}

      {(hasResult || toolCall.status === 'running') && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <StatusIcon className="h-3.5 w-3.5" style={{ color: statusConfig.bgColor }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              结果
            </span>
          </div>
          <div className="pl-4">
            {toolCall.status === 'error' ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>执行失败</AlertTitle>
                <AlertDescription>
                  <ResultContent result={toolCall.result} status={toolCall.status} />
                </AlertDescription>
              </Alert>
            ) : (
              <ResultContent result={toolCall.result} status={toolCall.status} />
            )}
          </div>
        </div>
      )}
    </div>
  ) : null;

  const borderColor =
    toolCall.status === 'error'
      ? 'var(--color-state-error)'
      : toolCall.status === 'running'
      ? 'var(--color-state-focus)'
      : 'var(--color-components-card-border)';

  if (collapsible && hasBody) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div
            className="flex items-center px-3 py-2.5 cursor-pointer rounded-t-lg transition-colors hover:bg-[var(--color-surface-secondary)]"
            style={{
              background: 'var(--color-components-card-bg)',
              border: `1px solid ${borderColor}`,
              borderRadius: isOpen ? '8px 8px 0 0' : '8px',
            }}
          >
            {headerContent}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div
            className="rounded-b-lg overflow-hidden"
            style={{ border: `1px solid ${borderColor}`, borderTop: 'none' }}
          >
            {bodyContent}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: `1px solid ${borderColor}` }}
    >
      <div
        className="px-3 py-2.5"
        style={{ background: 'var(--color-components-card-bg)' }}
      >
        {headerContent}
      </div>
      {bodyContent}
    </div>
  );
};

export const ToolCallRenderer: React.FC<ToolCallRendererProps> = ({
  toolCalls,
  isAnalyzing = false,
  className = '',
  showTimestamp = true,
  collapsible = false,
}) => {
  if (!toolCalls || toolCalls.length === 0) {
    if (isAnalyzing) {
      return (
        <div
          className={`${className} px-3 py-2.5 rounded-lg`}
          style={{
            background: 'var(--color-components-card-bg)',
            border: '1px solid var(--color-components-card-border)',
          }}
        >
          <div className="flex items-center gap-2">
            <Loading size="sm" />
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              正在分析工具需求...
            </span>
          </div>
        </div>
      );
    }
    return null;
  }

  const successCount = toolCalls.filter((c) => c.status === 'success').length;
  const errorCount = toolCalls.filter((c) => c.status === 'error').length;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4" style={{ color: 'var(--color-state-focus)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            工具调用 ({toolCalls.length})
          </span>
        </div>
        <div className="flex items-center gap-3">
          {successCount > 0 && (
            <span
              className="text-xs flex items-center gap-1"
              style={{ color: 'var(--color-state-success)' }}
            >
              <CheckCircle className="h-3 w-3" />
              {successCount} 成功
            </span>
          )}
          {errorCount > 0 && (
            <span
              className="text-xs flex items-center gap-1"
              style={{ color: 'var(--color-state-error)' }}
            >
              <AlertCircle className="h-3 w-3" />
              {errorCount} 失败
            </span>
          )}
          {isAnalyzing && (
            <div className="flex items-center gap-1.5">
              <Loading size="sm" />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                分析中...
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {toolCalls.map((toolCall) => (
          <ToolCallCard
            key={toolCall.id}
            toolCall={toolCall}
            showTimestamp={showTimestamp}
            collapsible={collapsible}
          />
        ))}
      </div>
    </div>
  );
};

export default ToolCallRenderer;
