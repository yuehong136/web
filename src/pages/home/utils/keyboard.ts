import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

/**
 * 输入法组合输入（如中文拼音）时，忽略 Enter 提交，避免误发送。
 */
export const shouldIgnoreEnterForIme = (e: ReactKeyboardEvent): boolean => {
  const nativeEvent = e.nativeEvent as KeyboardEvent
  return nativeEvent.isComposing || nativeEvent.keyCode === 229 || e.key === 'Process'
}
