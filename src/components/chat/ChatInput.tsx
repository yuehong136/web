import { useState, useRef, useCallback, useEffect } from "react";
import type { ReactNode, ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PromptSuggestion } from "./PromptSuggestion";
import type { PromptItem } from "@/types/mcp";
import { 
  Paperclip, Send, Mic, MicOff, X, Globe
} from "lucide-react";
import { toast } from "sonner";
// 直接定义类型，避免导入问题
interface SpeechConfig {
  enabled: boolean;
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
}

type SubmitType = 'enter' | 'shiftEnter';

// 操作按钮组件类型
export interface ActionsComponents {
  SendButton: ComponentType<any>;
  AttachButton: ComponentType<any>;
  VoiceButton: ComponentType<any>;
}

// 底部内容信息
export interface FooterInfo {
  components: ActionsComponents;
}

// 主要Props接口
export interface ChatInputProps {
  // 内容控制
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, event?: React.FormEvent<HTMLTextAreaElement> | React.ChangeEvent<HTMLTextAreaElement>) => void;
  
  // 提交相关
  onSubmit?: (message: string) => void;
  onCancel?: () => void;
  submitType?: SubmitType;
  
  // 状态控制
  disabled?: boolean;
  loading?: boolean;
  readOnly?: boolean;
  
  // 语音输入
  allowSpeech?: boolean | SpeechConfig;
  
  // 文件上传
  onPasteFile?: (firstFile: File, files: FileList) => void;
  
  // 自适应高度
  autoSize?: boolean | { minRows?: number; maxRows?: number };
  
  // 自定义组件
  components?: Record<'input', ComponentType>;
  
  // 自定义操作按钮
  actions?: ReactNode | ((oriNode: ReactNode, info: { components: ActionsComponents }) => ReactNode) | false;
  
  // 自定义内容
  header?: ReactNode;
  footer?: ReactNode | ((info: FooterInfo) => ReactNode);
  prefix?: ReactNode;
  
  // 样式
  className?: string;
  rootClassName?: string;
  floating?: boolean; // 新增：是否为浮动模式
  classNames?: {
    wrapper?: string;
    input?: string;
    actions?: string;
    footer?: string;
  };
  styles?: {
    wrapper?: React.CSSProperties;
    input?: React.CSSProperties;
    actions?: React.CSSProperties;
    footer?: React.CSSProperties;
  };
}

export function ChatInput({
  // 内容控制
  value: controlledValue,
  defaultValue = "",
  onChange,
  
  // 提交相关
  onSubmit,
  onCancel,
  submitType = 'enter',
  
  // 状态控制
  disabled = false,
  loading = false,
  readOnly = false,
  
  // 语音输入
  allowSpeech = false,
  
  // 文件上传
  onPasteFile,
  
  // 自适应高度
  autoSize = { maxRows: 8 },
  
  // 自定义组件
  components,
  
  // 自定义操作按钮
  actions,
  
  // 自定义内容
  header,
  footer,
  prefix,
  
  // 样式
  className = "",
  rootClassName = "",
  floating = false,
  classNames = {},
  styles = {},
}: ChatInputProps) {
  // 内部状态管理
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [deepThinkingEnabled, setDeepThinkingEnabled] = useState(false);
  const [globalSearchEnabled, setGlobalSearchEnabled] = useState(true);
  
  // @ 提示词功能状态
  const [showPromptSuggestion, setShowPromptSuggestion] = useState(false);
  const [promptSearchQuery, setPromptSearchQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [atTriggerPosition, setAtTriggerPosition] = useState(-1);
  const [inputBoxPosition, setInputBoxPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  
  // 语音识别相关
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  
  // 获取当前值
  const currentValue = controlledValue !== undefined ? controlledValue : internalValue;
  
  // 语音配置
  const speechConfig = typeof allowSpeech === 'object' ? allowSpeech : { enabled: allowSpeech };
  
  // 处理值变化
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    // 检查是否输入了 @
    const lastAtIndex = newValue.lastIndexOf('@', cursorPos - 1);
    
    if (lastAtIndex !== -1) {
      // 检查 @ 前面是否是空格、换行或字符串开头
      const charBeforeAt = lastAtIndex > 0 ? newValue[lastAtIndex - 1] : '';
      const isAtStart = lastAtIndex === 0;
      const isAfterWhitespace = /\s/.test(charBeforeAt);
      
      if (isAtStart || isAfterWhitespace) {
        // 检查 @ 到当前光标位置之间是否只包含字母、数字、空格
        const searchText = newValue.slice(lastAtIndex + 1, cursorPos);
        const isValidSearch = /^[a-zA-Z0-9\u4e00-\u9fa5\s]*$/.test(searchText);
        
        if (isValidSearch) {
          setAtTriggerPosition(lastAtIndex);
          setPromptSearchQuery(searchText);
          setShowPromptSuggestion(true);
          setCursorPosition(cursorPos);
        } else {
          // 如果包含特殊字符，关闭提示
          setShowPromptSuggestion(false);
        }
      }
    } else {
      // 没有找到 @，关闭提示
      setShowPromptSuggestion(false);
    }
    
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue, e);
  }, [controlledValue, onChange]);

  // 处理提示词选择
  const handlePromptSelect = useCallback((prompt: PromptItem) => {
    if (atTriggerPosition === -1) return;
    
    // 替换 @ 及其后面的搜索文本为选中的提示词
    const beforeAt = currentValue.slice(0, atTriggerPosition);
    const afterSearchText = currentValue.slice(atTriggerPosition + 1 + promptSearchQuery.length);
    const newValue = beforeAt + prompt.content + afterSearchText;
    
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    
    onChange?.(newValue);
    
    // 关闭提示框
    setShowPromptSuggestion(false);
    setAtTriggerPosition(-1);
    setPromptSearchQuery("");
    
    // 聚焦到输入框
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }, [currentValue, atTriggerPosition, promptSearchQuery, controlledValue, onChange]);

  // 关闭提示词弹窗
  const handlePromptClose = useCallback(() => {
    setShowPromptSuggestion(false);
    setAtTriggerPosition(-1);
    setPromptSearchQuery("");
  }, []);

  // 处理提交
  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (currentValue.trim() && !disabled && !loading) {
      onSubmit?.(currentValue.trim());
      
      // 清空输入框（仅在非受控模式下）
      if (controlledValue === undefined) {
        setInternalValue("");
      }
      
      // 清空附件
      setAttachedFiles([]);
      
      // 关闭提示词弹窗
      handlePromptClose();
    }
  }, [currentValue, disabled, loading, onSubmit, controlledValue, handlePromptClose]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 如果提示词弹窗打开，让弹窗处理键盘事件
    if (showPromptSuggestion) {
      return;
    }
    
    const shouldSubmit = (submitType === 'enter' && e.key === 'Enter' && !e.shiftKey) ||
                        (submitType === 'shiftEnter' && e.key === 'Enter' && e.shiftKey);
    
    if (shouldSubmit) {
      e.preventDefault();
      handleSubmit();
    }
  }, [submitType, handleSubmit, showPromptSuggestion]);

  // 处理语音输入
  const toggleVoiceInput = useCallback(() => {
    if (!speechConfig.enabled || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('您的浏览器不支持语音识别功能');
      return;
    }

    if (isRecording) {
      // 停止录音
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      // 开始录音
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = speechConfig.continuous ?? true;
      recognition.interimResults = speechConfig.interimResults ?? true;
      recognition.lang = speechConfig.language ?? 'zh-CN';
      
      recognition.onstart = () => {
        setIsRecording(true);
        toast.success('开始语音识别...');
      };
      
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        
        const newValue = currentValue + transcript;
        if (controlledValue === undefined) {
          setInternalValue(newValue);
        }
        onChange?.(newValue);
      };
      
      recognition.onerror = (event: any) => {
        console.error('语音识别错误:', event.error);
        toast.error('语音识别失败，请重试');
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    }
  }, [speechConfig, isRecording, currentValue, controlledValue, onChange]);

  // 处理文件选择
  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 处理文件上传
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setAttachedFiles(prev => [...prev, ...Array.from(files)]);
      
      if (onPasteFile) {
        onPasteFile(files[0], files);
      }
    }
    
    // 清空文件输入
    e.target.value = '';
  }, [onPasteFile]);

  // 移除附件
  const removeFile = useCallback((index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 处理粘贴事件
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = e.clipboardData.files;
    if (files.length > 0 && onPasteFile) {
      e.preventDefault();
      onPasteFile(files[0], files);
      setAttachedFiles(prev => [...prev, ...Array.from(files)]);
    }
  }, [onPasteFile]);

  // 输入组件
  const InputComponent = components?.input || Textarea;

  // 计算输入框位置
  const updateInputBoxPosition = useCallback(() => {
    if (inputContainerRef.current) {
      const rect = inputContainerRef.current.getBoundingClientRect();
      setInputBoxPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width
      });
    }
  }, []);

  // 当显示提示词弹窗时，计算位置
  useEffect(() => {
    if (showPromptSuggestion) {
      updateInputBoxPosition();
      
      // 监听窗口大小变化和滚动
      const handleResize = () => updateInputBoxPosition();
      const handleScroll = () => updateInputBoxPosition();
      
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [showPromptSuggestion, updateInputBoxPosition]);

  // 浮动模式的样式
  const floatingStyles = floating ? {
    backgroundColor: 'var(--color-chat-input-area-bg)',
    border: '1px solid var(--color-chat-input-area-border)',
    borderRadius: '16px',
    backdropFilter: 'var(--color-chat-input-area-backdrop)',
    WebkitBackdropFilter: 'var(--color-chat-input-area-backdrop)',
    boxShadow: 'var(--color-chat-input-area-shadow)',
    ...styles.wrapper
  } : styles.wrapper;

  return (
    <div 
      className={floating ? rootClassName : `p-6 ${rootClassName}`}
      style={floatingStyles}
    >
      <div className={floating ? classNames.wrapper : `max-w-4xl mx-auto ${classNames.wrapper}`}>
        {/* 头部内容 */}
        {header && <div className="mb-4">{header}</div>}
        
        {/* 附件预览 */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {attachedFiles.map((file, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* 主输入区域 - 参考Ant Design X的结构 */}
          <div 
            ref={inputContainerRef}
            className={`relative ${floating ? 'bg-transparent' : 'bg-[var(--color-components-input-bg)]'} rounded-[28px] border ${floating ? 'border-transparent' : 'border-border'} shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden`}
          >
            {/* 输入框区域 */}
            <div className="p-5 relative">
              <InputComponent
                ref={textareaRef}
                value={currentValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={isRecording ? '正在进行语音识别...' : '发消息、输入 @ 选择技能 或 选择文件'}
                className={`border-0 bg-transparent resize-none text-sm p-0 w-full focus-visible:ring-0 placeholder:text-muted-foreground/60 text-[var(--color-components-input-text)] ${className} ${classNames.input}`}
                style={{ ...styles.input }}
                disabled={disabled}
                readOnly={readOnly}
                rows={autoSize === true ? 2 : (typeof autoSize === 'object' ? autoSize.minRows || 2 : 2)}
              />
            </div>
            
            {/* Footer区域 - 参考Ant Design X的footer结构 */}
            <div className={`flex justify-between items-center px-5 py-3 bg-muted/30 ${classNames.footer}`} style={styles.footer}>
              {/* 左侧功能区 */}
              <div className="flex items-center gap-3">
                {/* Deep Thinking */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground">Deep Thinking</span>
                  <Switch
                    checked={deepThinkingEnabled}
                    onCheckedChange={setDeepThinkingEnabled}
                  />
                </div>
                
                <Separator orientation="vertical" className="h-4" />
                
                {/* Global Search */}
                <Button
                  type="button"
                  variant={globalSearchEnabled ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 px-3 text-sm"
                  onClick={() => setGlobalSearchEnabled(!globalSearchEnabled)}
                >
                  <Globe className="w-4 h-4 mr-1.5" />
                  Global Search
                </Button>
              </div>
              
              {/* 右侧操作按钮区 */}
              <div className={`flex items-center gap-2 ${classNames.actions}`} style={styles.actions}>
                {/* 附件按钮 */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={handleFileSelect}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                
                <Separator orientation="vertical" className="h-4" />
                
                {/* 语音按钮 */}
                {speechConfig.enabled && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`h-8 w-8 p-0 ${
                        isRecording 
                          ? 'text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={toggleVoiceInput}
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                    
                    <Separator orientation="vertical" className="h-4" />
                  </>
                )}
                
                {/* 发送按钮 */}
                {loading ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    className="h-8 px-4"
                    disabled
                  >
                    发送中...
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="sm"
                    variant="default"
                    className="h-8 px-4"
                    disabled={!currentValue.trim() || disabled}
                  >
                    <Send className="w-4 h-4 mr-1.5" />
                    发送
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
        
        {/* 底部提示文字 */}
        <div className="mt-3 text-center">
          <div className="text-xs text-muted-foreground">
            提示模式：Enter 发送・Shift+Enter 换行
          </div>
        </div>
        
        {/* 底部提示内容 */}
        {footer && typeof footer !== 'function' && (
          <div className="mt-3">
            {footer}
          </div>
        )}
        
        {/* 隐藏的文件输入 */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          className="hidden"
        />
        
        {/* @ 提示词弹窗 */}
        <PromptSuggestion
          visible={showPromptSuggestion}
          searchQuery={promptSearchQuery}
          onSearchChange={setPromptSearchQuery}
          onSelect={handlePromptSelect}
          onClose={handlePromptClose}
          position={inputBoxPosition ? {
            top: inputBoxPosition.top - 10, // 10px gap above input
            left: inputBoxPosition.left,
            width: inputBoxPosition.width
          } : undefined}
        />
      </div>
    </div>
  );
}