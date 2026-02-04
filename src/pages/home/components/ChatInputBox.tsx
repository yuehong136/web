import React, { useRef, useEffect, useCallback } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { ChatModelSelector } from '@/components/chat/ChatModelSelector'
import { SelectedTags } from './SelectedTags'
import { InputToolbar } from './InputToolbar'
import type { DialogApp } from '@/types/api'
import type { MCPServer } from '@/types/mcp'

interface ChatInputBoxProps {
  // 输入值
  inputValue: string
  onInputChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  placeholder?: string
  
  // 已选项
  selectedMCPServers: MCPServer[]
  selectedApps: DialogApp[]
  onRemoveSkill: (serverId: string) => void
  onRemoveApp: (appId: string) => void
  
  // 技能面板
  isSkillPanelOpen: boolean
  onSkillPanelToggle: () => void
  skillPanelRef: React.RefObject<HTMLButtonElement>
  skillPanelContent: React.ReactNode
  
  // 模型选择
  models: Record<string, any> | null
  selectedModelId: string
  onModelSelect: (modelId: string | null) => void
  modelsLoading: boolean
  isModelLocked: boolean
  
  // 发送
  onSend: () => void
  onStop?: () => void
  isStreaming?: boolean
  
  // 变体
  variant?: 'welcome' | 'chat'
}

export const ChatInputBox: React.FC<ChatInputBoxProps> = ({
  inputValue,
  onInputChange,
  onKeyDown,
  placeholder = '给我发消息或布置任务',
  selectedMCPServers,
  selectedApps,
  onRemoveSkill,
  onRemoveApp,
  isSkillPanelOpen,
  onSkillPanelToggle,
  skillPanelRef,
  skillPanelContent,
  models,
  selectedModelId,
  onModelSelect,
  modelsLoading,
  isModelLocked,
  onSend,
  onStop,
  isStreaming = false,
  variant = 'welcome',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 自动调整输入框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [inputValue])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value)
  }, [onInputChange])

  const isWelcome = variant === 'welcome'
  const hasSelectedItems = selectedMCPServers.length > 0 || selectedApps.length > 0

  return (
    <div className={cn(
      "bg-components-card-bg rounded-2xl relative",
      isWelcome ? "p-5 min-h-[110px]" : "p-4"
    )}>
      {/* 已选技能和应用标签 */}
      <SelectedTags
        selectedMCPServers={selectedMCPServers}
        selectedApps={selectedApps}
        onRemoveSkill={onRemoveSkill}
        onRemoveApp={onRemoveApp}
      />

      {/* 文本输入区 */}
      <Textarea
        ref={textareaRef}
        variant="chat"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full text-base placeholder:text-text-tertiary"
        rows={1}
        disabled={isStreaming}
      />

      {/* 工具栏 */}
      <div className="flex items-center justify-between mt-3">
        {/* 左侧工具按钮 */}
        <div className="flex items-center gap-2 relative">
          <div>
            <InputToolbar
              isSkillPanelOpen={isSkillPanelOpen}
              hasSelectedItems={hasSelectedItems}
              disabled={isStreaming}
              onAtClick={onSkillPanelToggle}
              size={isWelcome ? 'normal' : 'compact'}
            />
          </div>
          
          {/* 技能面板插槽 */}
          {skillPanelContent}
        </div>

        {/* 右侧：模型选择器 + 发送/停止按钮 */}
        <div className="flex items-center gap-3">
          {/* 模型选择器 */}
          <ChatModelSelector
            models={models || {}}
            selectedModelName={selectedModelId}
            onSelect={(modelName) => onModelSelect(modelName || '')}
            loading={modelsLoading}
            variant="minimal"
            dropdownDirection={isWelcome ? 'down' : 'up'}
            disabled={isStreaming || isModelLocked}
          />

          {/* 发送/停止按钮 */}
          {isStreaming && onStop ? (
            <button
              onClick={onStop}
              className={cn(
                "rounded-full flex items-center justify-center bg-state-error text-text-inverted hover:bg-state-error/90 transition-colors",
                isWelcome ? "w-10 h-10" : "w-9 h-9"
              )}
            >
              <Square className={isWelcome ? "w-5 h-5" : "w-4 h-4"} />
            </button>
          ) : (
            <button
              onClick={onSend}
              className={cn(
                "rounded-full flex items-center justify-center transition-colors",
                isWelcome ? "w-10 h-10" : "w-9 h-9",
                inputValue.trim()
                  ? "bg-text-primary hover:bg-text-secondary"
                  : "bg-border-default"
              )}
            >
              <ArrowUp className={cn(
                isWelcome ? "w-5 h-5" : "w-4 h-4",
                inputValue.trim() ? "text-text-inverted" : "text-text-tertiary"
              )} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
