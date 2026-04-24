import { useState } from "react";
import { CodeHighlighter } from "@ant-design/x";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Wrench, Clock, CheckCircle, XCircle, Terminal, PlayCircle } from "lucide-react";
import type { ParsedToolCall } from "./StreamResponseParser";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface ToolCall {
  id: string;
  tool_name: string;
  server_name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  input: any;
  output?: any;
  error?: string;
  duration?: number;
  timestamp: string;
}

interface ToolCallDisplayProps {
  toolCalls?: ToolCall[];
  parsedToolCalls?: ParsedToolCall[];
}

const detectLang = (content: string): string => {
  const t = content.trim();
  if (/^\s*(WITH|SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|EXPLAIN)\b/i.test(t)) return 'sql';
  try {
    JSON.parse(t);
    return 'json';
  } catch { /* ignore */ }
  return 'plaintext';
};

function ParamValue({ value }: { value: any }) {
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
}

function ParamsList({ args }: { args: Record<string, any> }) {
  const entries = Object.entries(args || {});
  if (entries.length === 0) {
    return (
      <span className="text-xs" style={{ color: 'var(--color-text-disabled)' }}>
        无参数
      </span>
    );
  }
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
}

function ResultView({ result, onOpenModal }: {
  result: string | any;
  onOpenModal?: (text: string) => void;
}) {
  if (!result) return null;

  if (result === 'Begin to call...') {
    return (
      <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        工具调用中...
      </div>
    );
  }

  const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);

  // Try parse as JSON object – render as structured key-value
  if (typeof result === 'string') {
    try {
      const parsed = JSON.parse(result);
      if (typeof parsed === 'object' && parsed !== null) {
        const entries = Object.entries(parsed);
        if (entries.length > 0 && entries.length <= 20) {
          return (
            <div className="space-y-1">
              <ParamsList args={parsed} />
              {onOpenModal && text.length > 300 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenModal(text)}
                  className="mt-1 h-auto py-1 text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  在对话框查看完整结果
                </Button>
              )}
            </div>
          );
        }
        return <CodeHighlighter lang="json">{JSON.stringify(parsed, null, 2)}</CodeHighlighter>;
      }
    } catch { /* ignore */ }
  }

  // Object value directly
  if (typeof result === 'object' && result !== null) {
    return <ParamsList args={result} />;
  }

  const lang = detectLang(text);

  return (
    <div className="space-y-1.5">
      <CodeHighlighter lang={lang}>{text}</CodeHighlighter>
      {onOpenModal && text.length > 500 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenModal(text)}
          className="h-auto py-1 text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          在对话框查看完整结果
        </Button>
      )}
    </div>
  );
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4" style={{ color: 'var(--color-state-warning)' }} />;
    case 'running':
      return (
        <PlayCircle className="w-4 h-4 animate-pulse" style={{ color: 'var(--color-state-focus)' }} />
      );
    case 'success':
      return <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-state-success)' }} />;
    case 'error':
      return <XCircle className="w-4 h-4" style={{ color: 'var(--color-state-error)' }} />;
    default:
      return <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-state-success)' }} />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="secondary" className="text-xs border" style={{
          background: 'var(--color-components-badge-warning-bg)',
          color: 'var(--color-components-badge-warning-text)',
          borderColor: 'var(--color-components-badge-border)',
        }}>等待中</Badge>
      );
    case 'running':
      return (
        <Badge variant="secondary" className="text-xs border" style={{
          background: 'var(--color-components-badge-info-bg)',
          color: 'var(--color-components-badge-info-text)',
          borderColor: 'var(--color-components-badge-border)',
        }}>运行中</Badge>
      );
    case 'success':
      return (
        <Badge variant="secondary" className="text-xs border" style={{
          background: 'var(--color-components-badge-success-bg)',
          color: 'var(--color-components-badge-success-text)',
          borderColor: 'var(--color-components-badge-border)',
        }}>成功</Badge>
      );
    case 'error':
      return (
        <Badge variant="destructive" className="text-xs border" style={{
          background: 'var(--color-components-badge-error-bg)',
          color: 'var(--color-components-badge-error-text)',
          borderColor: 'var(--color-components-badge-border)',
        }}>错误</Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="text-xs border" style={{
          background: 'var(--color-components-badge-success-bg)',
          color: 'var(--color-components-badge-success-text)',
          borderColor: 'var(--color-components-badge-border)',
        }}>完成</Badge>
      );
  }
};

export function ToolCallDisplay({ toolCalls, parsedToolCalls }: ToolCallDisplayProps) {
  const [expandedCalls, setExpandedCalls] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalText, setModalText] = useState('');
  const [modalTitle, setModalTitle] = useState('工具结果');

  const displayCalls = parsedToolCalls || toolCalls || [];

  const toggleExpanded = (callId: string) => {
    if (expandedCalls.has(callId)) {
      setExpandedCalls(new Set());
    } else {
      setExpandedCalls(new Set([callId]));
    }
  };

  const openModal = (text: string, title?: string) => {
    setModalText(text);
    setModalTitle(title || '工具结果');
    setModalOpen(true);
  };

  if (displayCalls.length === 0) return null;

  return (
    <div className="space-y-2 my-3">
      <div
        className="flex items-center gap-2 text-sm font-medium"
        style={{ color: 'var(--color-text-primary)' }}
      >
        <Wrench className="w-4 h-4" />
        使用 MCP 工具 ({displayCalls.length})
      </div>

      {displayCalls.map((call, index) => {
        const isLegacyCall = 'tool_name' in call;
        const toolName = isLegacyCall ? (call as any).tool_name : (call as any).name;
        const serverName = isLegacyCall ? (call as any).server_name : '';
        const status = (call as any).status;
        const timestamp = (call as any).timestamp;
        const input = isLegacyCall ? (call as any).input : (call as any).args;
        const output = isLegacyCall ? (call as any).output : (call as any).result;
        const error = isLegacyCall ? (call as any).error : undefined;
        const fallbackIdBase = `${toolName || 'tool'}_${JSON.stringify(input || {})}`;
        const callId = `${(call as any).id ?? fallbackIdBase}_${index}`;
        const isExpanded = expandedCalls.has(callId);
        const hasInput = input && Object.keys(input).length > 0;
        const hasOutput = !!output;
        const hasBody = hasInput || hasOutput || !!error;

        const borderColor =
          status === 'error'
            ? 'var(--color-state-error)'
            : status === 'running'
            ? 'var(--color-state-focus)'
            : 'var(--color-components-card-border)';

        return (
          <Card
            key={callId}
            className="overflow-hidden border-l-[3px]"
            style={{
              borderLeftColor: borderColor,
              background: 'var(--color-components-card-bg)',
            }}
          >
            <Collapsible
              open={isExpanded}
              onOpenChange={() => hasBody && toggleExpanded(callId)}
            >
              <CollapsibleTrigger asChild>
                <div
                  className="flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors hover:bg-[var(--color-surface-secondary)]"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {getStatusIcon(status)}
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span
                        className="font-mono font-medium text-sm"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {serverName ? `[${serverName}] ` : ''}{toolName}
                      </span>
                      {getStatusBadge(status)}
                      {timestamp && (
                        <span
                          className="text-xs"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {timestamp}
                        </span>
                      )}
                    </div>
                  </div>
                  {hasBody && (
                    <Button variant="ghost" size="sm" className="p-0 h-auto ml-2 shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                      ) : (
                        <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                      )}
                    </Button>
                  )}
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div
                  className="px-3 pb-3 pt-2 space-y-3 border-t"
                  style={{
                    borderColor: 'var(--color-components-card-border)',
                    background: 'var(--color-surface-secondary)',
                  }}
                >
                  {/* Parameters */}
                  {hasInput && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Terminal
                          className="w-3.5 h-3.5"
                          style={{ color: 'var(--color-text-secondary)' }}
                        />
                        <span
                          className="text-xs font-medium"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          参数
                        </span>
                      </div>
                      <div className="pl-4">
                        <ParamsList args={input} />
                      </div>
                    </div>
                  )}

                  {/* Result */}
                  {hasOutput && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(status)}
                        <span
                          className="text-xs font-medium"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          结果
                        </span>
                      </div>
                      <div className="pl-4">
                        <ResultView
                          result={output}
                          onOpenModal={(text) => openModal(text, `${toolName} 结果`)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" style={{ color: 'var(--color-state-error)' }} />
                        <span
                          className="text-xs font-medium"
                          style={{ color: 'var(--color-state-error)' }}
                        >
                          错误信息
                        </span>
                      </div>
                      <div
                        className="pl-4 rounded-lg p-2.5 text-sm font-mono"
                        style={{
                          background: 'var(--color-components-alert-error-bg)',
                          color: 'var(--color-components-alert-error-text)',
                          border: '1px solid var(--color-components-alert-error-border)',
                        }}
                      >
                        {error}
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}

      {/* Full result modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl w-[90vw]">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <div className="mt-2 max-h-[70vh] overflow-y-auto">
            {(() => {
              try {
                const parsed = JSON.parse(modalText);
                if (typeof parsed === 'object' && parsed !== null) {
                  return <ParamsList args={parsed} />;
                }
              } catch { /* ignore */ }
              const lang = detectLang(modalText);
              return <CodeHighlighter lang={lang}>{modalText}</CodeHighlighter>;
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
