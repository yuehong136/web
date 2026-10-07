import { useRef, useEffect, useCallback } from 'react'
import type {
  ChangeEvent,
  FC,
  KeyboardEvent,
  ReactNode,
  RefObject,
} from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUp, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { ChatModelSelector } from '@/components/chat/ChatModelSelector'
import { SelectedTags } from './SelectedTags'
import { InputToolbar } from './InputToolbar'
import type { DialogApp } from '@/types/api'
import type { MCPServer } from '@/types/mcp'
import type { MyLLMProvider } from '@/stores/model'

interface ChatInputBoxProps {
  // 输入值
  inputValue: string
  onInputChange: (value: string) => void
  onKeyDown: (e: KeyboardEvent) => void
  placeholder?: string

  // 已选项
  selectedMCPServers: MCPServer[]
  selectedApps: DialogApp[]
  onRemoveSkill: (serverId: string) => void
  onRemoveApp: (appId: string) => void

  // 技能面板
  isSkillPanelOpen: boolean
  onSkillPanelToggle: () => void
  skillPanelRef: RefObject<HTMLButtonElement>
  skillPanelContent: ReactNode

  // 模型选择
  models: MyLLMProvider | null
  selectedModelId: string
  onModelSelect: (modelId: string | null) => void
  modelsLoading: boolean
  isModelLocked: boolean

  // 发送
  onSend: () => void
  onStop?: () => void
  isStreaming?: boolean
  /** 请求已接纳（会话准备或流式中）：锁定技能/应用、模型与发送，输入框仍可编辑 */
  scopeLocked?: boolean
  /** 暂时不接纳发送（如选中会话的历史载入中）：只禁用发送，输入与范围选择照常 */
  sendBlocked?: boolean

  // 变体
  variant?: 'welcome' | 'chat'
}

export const ChatInputBox: FC<ChatInputBoxProps> = ({
  inputValue,
  onInputChange,
  onKeyDown,
  placeholder,
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
  scopeLocked = isStreaming,
  sendBlocked = false,
  variant = 'welcome',
}) => {
  const { t } = useTranslation()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const resolvedPlaceholder =
    placeholder ?? t('home.input.welcomePlaceholder', '给我发消息或布置任务')

  // 自动调整输入框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [inputValue])

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onInputChange(e.target.value)
    },
    [onInputChange],
  )

  const isWelcome = variant === 'welcome'
  const hasSelectedItems =
    selectedMCPServers.length > 0 || selectedApps.length > 0
  const canSend = Boolean(inputValue.trim()) && !scopeLocked && !sendBlocked

  return (
    <div
      className={cn(
        'relative rounded-2xl bg-components-card-bg',
        isWelcome ? 'min-h-[110px] p-5' : 'p-4',
      )}
    >
      {/* 已选技能和应用标签 */}
      <SelectedTags
        selectedMCPServers={selectedMCPServers}
        selectedApps={selectedApps}
        onRemoveSkill={onRemoveSkill}
        onRemoveApp={onRemoveApp}
        disabled={scopeLocked}
      />

      {/* 文本输入区：生成中也可编写下一条草稿 */}
      <Textarea
        ref={textareaRef}
        variant="chat"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={onKeyDown}
        placeholder={resolvedPlaceholder}
        className="w-full text-base placeholder:text-text-tertiary"
        rows={1}
      />

      {/* 工具栏 */}
      <div className="mt-3 flex items-center justify-between">
        {/* 左侧工具按钮 */}
        <div className="relative flex items-center gap-2">
          <div>
            <InputToolbar
              isSkillPanelOpen={isSkillPanelOpen}
              hasSelectedItems={hasSelectedItems}
              disabled={scopeLocked}
              onAtClick={onSkillPanelToggle}
              atButtonRef={skillPanelRef}
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
            disabled={scopeLocked || isModelLocked}
          />

          {/* 发送/停止按钮 */}
          {isStreaming && onStop ? (
            <button
              type="button"
              onClick={onStop}
              aria-label={t('home.input.stop', '停止')}
              className={cn(
                'flex items-center justify-center rounded-full bg-status-error-solid text-status-error-on-solid transition-colors hover:bg-status-error-solid-hover',
                isWelcome ? 'h-10 w-10' : 'h-9 w-9',
              )}
            >
              <Square className={isWelcome ? 'h-5 w-5' : 'h-4 w-4'} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSend}
              disabled={!canSend}
              aria-label={t('common.submit', '提交')}
              className={cn(
                'flex items-center justify-center rounded-full transition-colors',
                isWelcome ? 'h-10 w-10' : 'h-9 w-9',
                canSend
                  ? 'bg-components-button-primary-bg hover:bg-components-button-primary-bg-hover'
                  : 'bg-components-button-primary-bg-disabled',
              )}
            >
              <ArrowUp
                className={cn(
                  isWelcome ? 'h-5 w-5' : 'h-4 w-4',
                  canSend
                    ? 'text-components-button-primary-text'
                    : 'text-components-button-primary-text-disabled',
                )}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
