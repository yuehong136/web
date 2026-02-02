/**
 * Think 包装组件
 * 用于展示 AI 思考过程，支持状态管理和展开/折叠
 * 
 * 展示组件原则：只接收 props，通过受控方式管理内部 UI 状态
 */
import React from 'react'
import { Think } from '@ant-design/x'
import type { ThinkingStatus } from '@/utils/think-utils'

export interface ThinkWrapperProps {
  /** 思考内容 */
  children: React.ReactNode
  /** 思考状态 */
  status: ThinkingStatus
  /** 消息的唯一标识，用于区分不同消息的折叠状态 */
  messageId?: string
  /** 自定义标题（可选） */
  titles?: {
    thinking?: string
    complete?: string
  }
  /** 思考完成后自动折叠的延迟时间（毫秒），设为 0 禁用自动折叠 */
  autoCollapseDelay?: number
}

/**
 * Think 展开状态组件
 * 
 * 特性：
 * - 思考中（thinking）时强制展开，显示加载动画
 * - 思考完成（complete）时延迟自动折叠，用户可手动展开
 * - 记忆用户的展开/折叠选择
 * 
 * @example
 * <ThinkWrapper status="thinking" messageId={msg.id}>
 *   <div className="text-sm">{thinkContent}</div>
 * </ThinkWrapper>
 */
export const ThinkWrapper: React.FC<ThinkWrapperProps> = React.memo(({ 
  children, 
  status,
  messageId,
  titles = {
    thinking: '思考中...',
    complete: '思考完成'
  },
  autoCollapseDelay = 800
}) => {
  const isThinking = status === 'thinking'
  
  // 简化逻辑：直接根据 status 控制展开状态
  // - thinking：强制展开
  // - complete：用户可手动控制
  const [userExpanded, setUserExpanded] = React.useState(true)
  
  // 当状态为 thinking 时，始终展开；complete 时使用用户控制的状态
  const expanded = isThinking ? true : userExpanded
  
  // 当从 thinking 变为 complete 时，延迟折叠
  const prevStatusRef = React.useRef(status)
  React.useEffect(() => {
    if (autoCollapseDelay > 0 && prevStatusRef.current === 'thinking' && status === 'complete') {
      const timer = setTimeout(() => {
        setUserExpanded(false)
      }, autoCollapseDelay)
      return () => clearTimeout(timer)
    }
    prevStatusRef.current = status
  }, [status, autoCollapseDelay])
  
  // 根据状态显示不同的标题
  const title = isThinking ? titles.thinking : titles.complete
  
  return (
    <Think
      title={title}
      loading={isThinking}
      expanded={expanded}
      onExpand={setUserExpanded}
      blink={isThinking}
    >
      {children}
    </Think>
  )
})

ThinkWrapper.displayName = 'ThinkWrapper'

export default ThinkWrapper
