import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolCallDisplay } from "./ToolCallDisplay";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ReferenceImageList } from "./ReferenceImageList";
import { Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "@/lib/toast";
import { copyToClipboard } from "@/lib/utils";
import type { ReferenceChunk } from "@/utils/reference-replacer";

// 直接定义类型，避免导入问题
interface ChatMessageType {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: any[];
  parsedToolCalls?: any[];
  referenceChunks?: ReferenceChunk[];
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  toolCalls?: ChatMessageType['toolCalls'];
  parsedToolCalls?: ChatMessageType['parsedToolCalls'];
  referenceChunks?: ReferenceChunk[];  // 新增：引用 chunks 数据
  isLoading?: boolean;  // 新增：是否正在加载
}

export function ChatMessage({ role, content, timestamp, toolCalls, parsedToolCalls, referenceChunks, isLoading = false }: ChatMessageProps) {
  const isAssistant = role === 'assistant';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    
    try {
      await copyToClipboard(content);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
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
          className="font-medium text-sm"
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
                  
                  {/* 图片引用列表 - 在消息内容下方展示图片类型的引用 */}
                  {!isLoading && content && referenceChunks && referenceChunks.length > 0 && (
                    <ReferenceImageList
                      referenceChunks={referenceChunks}
                      messageContent={content}
                      className="mt-3"
                    />
                  )}
                  
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
                // 用户消息：主题区分的气泡样式
                <div>
                  <Card className="p-4 bg-muted dark:bg-primary text-foreground dark:text-primary-foreground">
                    <MarkdownRenderer 
                      content={content} 
                      className="dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>p]:text-current [&>*]:text-current" 
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