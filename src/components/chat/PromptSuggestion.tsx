import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Search, FileText, Image, Radio, FileAudio, 
  ChevronDown, ChevronUp 
} from 'lucide-react';

export interface PromptItem {
  id: string;
  title: string;
  description: string;
  content: string;
  icon: React.ReactNode;
  category?: string;
}

export interface PromptSuggestionProps {
  visible: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelect: (prompt: PromptItem) => void;
  onClose: () => void;
  position?: {
    top: number;
    left: number;
    width: number;
  };
}

// 预定义的提示词数据
const DEFAULT_PROMPTS: PromptItem[] = [
  {
    id: "ai-ppt",
    title: "AI PPT",
    description: "帮你一键生成 PPT",
    content: "请帮我制作一个关于[主题]的PPT演示文稿，包含以下要点：1. 引言和背景 2. 主要内容分析 3. 关键数据展示 4. 结论和建议。请为每页幻灯片提供标题、要点和建议的视觉元素描述。",
    icon: <FileText className="w-4 h-4" />,
    category: "创作"
  },
  {
    id: "video-generation",
    title: "视频生成",
    description: "自由运镜，图片文字一键成片",
    content: "我需要制作一个关于[主题]的视频，请帮我：1. 设计视频脚本和分镜头 2. 描述每个场景的视觉效果 3. 推荐合适的转场效果 4. 提供文字说明和旁白建议 5. 建议背景音乐风格。视频时长约[X]分钟。",
    icon: <Image className="w-4 h-4" />,
    category: "创作"
  },
  {
    id: "ai-podcast",
    title: "AI 播客",
    description: "智能解析文档网页，一键生成播客节目",
    content: "请基于以下材料制作一期播客节目：[插入文档/网页内容]。请帮我：1. 提取核心观点和亮点 2. 设计播客结构（开场、主体、结尾）3. 编写主持人串词 4. 准备互动问题 5. 总结关键要点。播客时长约[X]分钟。",
    icon: <Radio className="w-4 h-4" />,
    category: "内容处理"
  },
  {
    id: "meeting-notes",
    title: "记录会议",
    description: "帮助你记录会议，生成会议总结",
    content: "请帮我整理会议内容并生成结构化的会议纪要：[插入会议记录/音频转文字]。请包含：1. 会议基本信息（时间、参与者、议题）2. 讨论要点总结 3. 决策事项 4. 行动计划和责任人 5. 后续跟进事项。",
    icon: <FileAudio className="w-4 h-4" />,
    category: "效率工具"
  },
  {
    id: "deep-research",
    title: "深入研究",
    description: "搜索海量信息，生成研究报告",
    content: "我需要对[研究主题]进行深入分析，请帮我：1. 收集相关的最新信息和数据 2. 分析行业趋势和发展动态 3. 整理不同观点和专家意见 4. 提供数据支撑和案例分析 5. 生成结构化的研究报告，包含背景、现状、分析、结论和建议。",
    icon: <Search className="w-4 h-4" />,
    category: "研究分析"
  }
];

export function PromptSuggestion({
  visible,
  searchQuery,
  onSearchChange,
  onSelect,
  onClose,
  position
}: PromptSuggestionProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // 过滤提示词
  const filteredPrompts = DEFAULT_PROMPTS.filter(prompt =>
    prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // 键盘事件处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredPrompts.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredPrompts.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredPrompts[selectedIndex]) {
          onSelect(filteredPrompts[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredPrompts, selectedIndex, onSelect, onClose]);



  // 滚动到选中项
  useEffect(() => {
    if (visible && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [visible, selectedIndex]);

  if (!visible) return null;

  // 计算弹窗位置 - 使用传入的position优先，否则使用默认值
  let positionStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 1000,
  };

  if (position?.top !== undefined) {
    // 如果有顶部位置，显示在输入框上方
    positionStyle = {
      ...positionStyle,
      top: position.top,
      left: position.left || 20,
      width: position.width ? `${position.width}px` : 'auto',
      maxWidth: position.width ? `${position.width}px` : '28rem',
      transform: 'translateY(-100%)', // 向上偏移完整高度
    };
  } else {
    // 默认位置（底部固定）
    positionStyle = {
      ...positionStyle,
      bottom: 60,
      left: 20,
      right: 20,
    };
  }

  return (
    <>
      {/* 遮罩层 */}
      <div 
        className="fixed inset-0 z-[999]" 
        onClick={onClose}
      />
      
      {/* 弹窗主体 - 固定高度设计 */}
      <div
        ref={containerRef}
        style={positionStyle}
        className="bg-[var(--color-background-surface)] dark:bg-[var(--color-background-surface)] rounded-xl shadow-xl border border-[var(--color-border-default)] w-full max-w-md h-[400px] flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* 搜索框 - 固定在顶部 */}
        <div className="flex-shrink-0 p-4 border-b border-[var(--color-border-subtle)]">
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索技能"
            className="w-full h-9 bg-[var(--color-background-default)] border-[var(--color-border-default)] text-[var(--color-text-primary)]"
            autoFocus
          />
        </div>

        {/* 提示词列表 - 固定高度，可滚动 */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2">
              {filteredPrompts.length > 0 ? (
                filteredPrompts.map((prompt, index) => (
                  <Button
                    key={prompt.id}
                    ref={(el) => { itemRefs.current[index] = el; }}
                    variant="ghost"
                    className={`w-full justify-start text-left p-3 h-auto mb-2 rounded-lg transition-all duration-200 ${
                      index === selectedIndex 
                        ? 'bg-[var(--color-state-hover)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border-accent)]' 
                        : 'hover:bg-[var(--color-state-hover)] border border-transparent text-[var(--color-text-secondary)]'
                    }`}
                    onClick={() => onSelect(prompt)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex-shrink-0 mt-1 text-[var(--color-text-tertiary)]">
                        {prompt.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate text-[var(--color-text-primary)]">
                            {prompt.title}
                          </span>
                          {prompt.category && (
                            <span className="text-xs text-[var(--color-text-tertiary)] bg-[var(--color-background-subtle)] px-2 py-0.5 rounded-full">
                              {prompt.category}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
                          {prompt.description}
                        </p>
                      </div>
                    </div>
                  </Button>
                ))
              ) : (
                <div className="text-center py-12 text-[var(--color-text-tertiary)]">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium mb-1">没有找到匹配的提示词</p>
                  <p className="text-xs">尝试使用其他关键词搜索</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 底部提示 - 固定在底部 */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-background-subtle)]/30">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <ChevronUp className="w-3 h-3" />
                <ChevronDown className="w-3 h-3" />
                <span className="ml-1">选择</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-[var(--color-background-default)] text-[var(--color-text-primary)] rounded border border-[var(--color-border-default)]">Enter</kbd>
                <span>确认</span>
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-xs bg-[var(--color-background-default)] text-[var(--color-text-primary)] rounded border border-[var(--color-border-default)]">Esc</kbd>
              <span>关闭</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

