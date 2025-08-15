import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolCallDisplay } from "./ToolCallDisplay";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "@/lib/toast";
// 直接定义类型，避免导入问题
interface ChatMessageType {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: any[];
  parsedToolCalls?: any[];
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  toolCalls?: ChatMessageType['toolCalls'];
  parsedToolCalls?: ChatMessageType['parsedToolCalls'];
  isLoading?: boolean;  // 新增：是否正在加载
}

export function ChatMessage({ role, content, timestamp, toolCalls, parsedToolCalls, isLoading = false }: ChatMessageProps) {
  const isAssistant = role === 'assistant';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    
    try {
      // 首先尝试使用 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        toast.success('已复制到剪贴板');
        // 2秒后重置复制状态
        setTimeout(() => setCopied(false), 2000);
      } else {
        // 回退方案：使用 document.execCommand
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopied(true);
            toast.success('已复制到剪贴板');
            setTimeout(() => setCopied(false), 2000);
          } else {
            throw new Error('Copy command failed');
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // 最后的回退方案：提示用户手动复制
      toast.error('复制失败，请手动选择文本复制');
    }
  };

  return (
    <div className={`flex gap-4 mb-6 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      <Avatar className="w-8 h-8">
        <AvatarFallback 
          style={{
            backgroundColor: isAssistant ? '#3b82f6' : '#6b7280',
            color: '#ffffff'
          }}
        >
          {isAssistant ? 'AI' : 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className={`flex-1 ${isAssistant ? '' : 'flex justify-end'}`}>
        <div className={`max-w-[80%] ${isAssistant ? '' : 'flex flex-col items-end'}`}>
          {/* 工具调用显示 */}
          {isAssistant && ((toolCalls && toolCalls.length > 0) || (parsedToolCalls && parsedToolCalls.length > 0)) && (
            <div className="mb-3">
              <ToolCallDisplay toolCalls={toolCalls} parsedToolCalls={parsedToolCalls} />
            </div>
          )}
          
          {/* 消息内容 */}
          {(content || isLoading) && (
            <>
              {isAssistant ? (
                // AI消息：无边框样式，更自然的文本流
                <div className="space-y-2">
                  <div className="text-foreground">
                    {content ? (
                      <MarkdownRenderer 
                        content={content} 
                        className="prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" 
                      />
                    ) : isLoading ? (
                      <span className="text-muted-foreground">正在思考中...</span>
                    ) : null}
                  </div>
                  
                  {/* AI消息操作栏 - 只在消息生成完成后显示 */}
                  {!isLoading && (
                    <div className="flex items-center gap-1 pt-1 opacity-60 hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-1.5 text-muted-foreground hover:text-foreground"
                        onClick={handleCopy}
                        title={copied ? "已复制" : "复制"}
                      >
                        {copied ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-1.5 text-muted-foreground hover:text-foreground">
                        <ThumbsUp className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-1.5 text-muted-foreground hover:text-foreground">
                        <ThumbsDown className="w-3 h-3" />
                      </Button>
                      {timestamp && (
                        <span className="text-xs text-muted-foreground ml-auto">{timestamp}</span>
                      )}
                    </div>
                  )}
                  
                  {/* 生成中的指示器 */}
                  {isLoading && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                      </div>
                      <span className="text-xs text-muted-foreground">正在生成...</span>
                    </div>
                  )}
                </div>
              ) : (
                // 用户消息：保持气泡样式
                <div>
                  <Card className="p-4 bg-primary text-primary-foreground">
                    <MarkdownRenderer 
                      content={content} 
                      className="prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0" 
                    />
                  </Card>
                  {/* 用户消息操作栏 */}
                  <div className="flex items-center justify-end gap-1 pt-1 opacity-60 hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-1.5 text-muted-foreground hover:text-foreground"
                      onClick={handleCopy}
                      title={copied ? "已复制" : "复制"}
                    >
                      {copied ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                    {timestamp && (
                      <span className="text-xs text-muted-foreground ml-2">{timestamp}</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}