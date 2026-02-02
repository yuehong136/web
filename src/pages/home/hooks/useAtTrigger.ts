/**
 * @ 触发逻辑 Hook
 * 处理输入框中 @ 符号的检测和删除
 */

import { useState, useCallback } from 'react'

export const useAtTrigger = () => {
  const [atTriggerPosition, setAtTriggerPosition] = useState<number | null>(null)
  const [skillPanelOpen, setSkillPanelOpen] = useState(false)

  // 处理输入变化，检测 @ 符号
  const handleInputChange = useCallback((
    newValue: string,
    prevValue: string,
    cursorPosition: number
  ): { shouldOpenPanel: boolean } => {
    // 检查是否新输入了 @ 符号
    if (newValue.length > prevValue.length) {
      const addedChar = newValue[cursorPosition - 1]
      if (addedChar === '@') {
        // 检查 @ 前面是否是空格、换行或字符串开头
        const charBeforeAt = cursorPosition > 1 ? newValue[cursorPosition - 2] : ''
        const isAtStart = cursorPosition === 1
        const isAfterWhitespace = /\s/.test(charBeforeAt)
        
        if (isAtStart || isAfterWhitespace || charBeforeAt === '') {
          // 记录 @ 的位置，打开技能面板
          setAtTriggerPosition(cursorPosition - 1)
          setSkillPanelOpen(true)
          return { shouldOpenPanel: true }
        }
      }
    }
    return { shouldOpenPanel: false }
  }, [])

  // 删除用户输入的 @ 符号
  const removeAtSymbol = useCallback((inputValue: string): string => {
    if (atTriggerPosition !== null && inputValue[atTriggerPosition] === '@') {
      const newValue = inputValue.slice(0, atTriggerPosition) + inputValue.slice(atTriggerPosition + 1)
      setAtTriggerPosition(null)
      return newValue
    }
    return inputValue
  }, [atTriggerPosition])

  // 重置状态
  const resetAtTrigger = useCallback(() => {
    setAtTriggerPosition(null)
  }, [])

  return {
    atTriggerPosition,
    skillPanelOpen,
    setSkillPanelOpen,
    handleInputChange,
    removeAtSymbol,
    resetAtTrigger,
  }
}
