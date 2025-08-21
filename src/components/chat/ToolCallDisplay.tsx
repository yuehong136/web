import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, ChevronUp, Wrench, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatSearchResult } from "./StreamResponseParser";
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

// 结果文本展示组件（不截断内容，仅限制可视高度并允许滚动/放大）
function ResultPane({ 
  text,
  isExpanded,
  onToggle,
  onOpenModal,
}: {
  text: string;
  isExpanded: boolean;
  onToggle: () => void;
  onOpenModal: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className={`bg-muted rounded-lg p-3 border ${isExpanded ? 'max-h-[600px]' : 'max-h-[300px]'} overflow-y-auto transition-all duration-300`}>
        <pre className="text-sm text-wrap whitespace-pre-wrap">{text}</pre>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="text-primary hover:text-primary/80 flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              收起视窗
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              扩大视窗
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenModal}
          className="text-primary hover:text-primary/80"
        >
          在对话框查看
        </Button>
      </div>
    </div>
  );
}

export function ToolCallDisplay({ toolCalls, parsedToolCalls }: ToolCallDisplayProps) {
  const [expandedCalls, setExpandedCalls] = useState<Set<string>>(new Set());
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [modalOpenFor, setModalOpenFor] = useState<string | null>(null);
  const [modalText, setModalText] = useState<string>("");
  const [modalTitle, setModalTitle] = useState<string>("工具结果");
  
  // 使用新的解析数据或回退到原始数据
  const displayCalls = parsedToolCalls || toolCalls || [];
  
  const toggleExpanded = (callId: string) => {
    if (expandedCalls.has(callId)) {
      // 已展开 -> 收起所有
      setExpandedCalls(new Set());
    } else {
      // 只展开当前，其他全部收起（手风琴模式）
      setExpandedCalls(new Set([callId]));
    }
  };
  
  const toggleResultExpanded = (callId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(callId)) {
      newExpanded.delete(callId);
    } else {
      newExpanded.add(callId);
    }
    setExpandedResults(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'running':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">等待中</Badge>;
      case 'running':
        return <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">运行中</Badge>;
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">成功</Badge>;
      case 'error':
        return <Badge variant="destructive">错误</Badge>;
      default:
        return <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">完成</Badge>;
    }
  };

  const renderSearchResult = (result: string, callId: string, toolNameForTitle: string) => {
    if (result === 'Begin to call...') {
      return <div className="text-sm text-muted-foreground">工具调用中...</div>;
    }
    
    // 仅当文本较短时使用简洁卡片预览；否则用滚动面板展示全文
    const parsedResult = formatSearchResult(result);
    const useCompactCard = parsedResult && result.length <= 300;
    if (useCompactCard) {
      return (
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-blue-900 mb-1">{parsedResult!.title}</h4>
                <p className="text-sm text-blue-700 mb-2">{parsedResult!.snippet}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:text-primary/80"
                onClick={() => {
                  setModalOpenFor(callId);
                  setModalText(result);
                  setModalTitle(`${toolNameForTitle} 结果`);
                }}
              >
                查看原文
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    // 默认：使用滚动面板展示全文（不截断）
    return (
      <ResultPane 
        text={result}
        isExpanded={expandedResults.has(callId)}
        onToggle={() => toggleResultExpanded(callId)}
        onOpenModal={() => {
          setModalOpenFor(callId);
          setModalText(result);
          setModalTitle(`${toolNameForTitle} 结果`);
        }}
      />
    );
  };

  if (displayCalls.length === 0) return null;

  return (
    <div className="space-y-3 my-4">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <Wrench className="w-4 h-4" />
        使用MCP工具 ({displayCalls.length})
      </div>
      
      {displayCalls.map((call, index) => {
        const isLegacyCall = 'tool_name' in call;
        const toolName = isLegacyCall ? (call as any).tool_name : (call as any).name;
        const serverName = isLegacyCall ? (call as any).server_name : 'jina-mcp-server';
        const status = (call as any).status;
        const timestamp = (call as any).timestamp;
        const input = isLegacyCall ? (call as any).input : (call as any).args;
        const output = isLegacyCall ? (call as any).output : (call as any).result;
        const error = isLegacyCall ? (call as any).error : undefined;
        // 生成稳定唯一ID：即使原始 id 存在也追加 index，避免不同工具复用了相同 id 导致联动展开
        const fallbackIdBase = `${toolName || 'tool'}_${JSON.stringify(input || {})}`;
        const callId = `${(call as any).id ?? fallbackIdBase}_${index}`;
        
        return (
          <Card key={callId} className="border-l-4 border-l-blue-500 bg-blue-50/30">
            <Collapsible
              open={expandedCalls.has(callId)}
              onOpenChange={() => toggleExpanded(callId)}
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 hover:bg-blue-50/50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          [{serverName}] {toolName}
                        </span>
                        {getStatusBadge(status)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {timestamp}
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    {expandedCalls.has(callId) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-3">
                  {/* 参数 */}
                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center gap-1">
                      <span className="text-orange-600">📋</span>
                      参数
                    </div>
                    <div className="bg-muted rounded-lg p-3 border">
                      <pre className="text-sm text-wrap whitespace-pre-wrap text-foreground">
                        {JSON.stringify(input, null, 2)}
                      </pre>
                    </div>
                  </div>
                  
                  {/* 结果 */}
                  {output && (
                    <div>
                      <div className="text-sm font-medium mb-2 flex items-center gap-1">
                        <span className="text-green-600">📊</span>
                        结果
                      </div>
                      {renderSearchResult(output, callId, toolName || '工具')}
                    </div>
                  )}
                  
                  {/* 错误信息 */}
                  {error && (
                    <div>
                      <div className="text-sm font-medium mb-2 text-red-600 flex items-center gap-1">
                        <span>❌</span>
                        错误信息
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <pre className="text-sm text-red-800 text-wrap whitespace-pre-wrap">
                          {error}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}

      {/* 结果对话框 */}
      <Dialog open={!!modalOpenFor} onOpenChange={(open) => !open && setModalOpenFor(null)}>
        <DialogContent className="max-w-4xl w-[90vw]">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <div className="mt-2 bg-muted rounded-lg p-3 border max-h-[70vh] overflow-y-auto">
            <pre className="text-sm text-wrap whitespace-pre-wrap">{modalText}</pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

