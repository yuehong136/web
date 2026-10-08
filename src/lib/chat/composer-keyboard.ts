import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

/**
 * 输入法组合输入（如中文拼音）时的 Enter 只确认组字，不提交消息。浏览器对组字
 * 结束的那次 Enter 报告不一：有的置 `isComposing`，有的只给 keyCode 229 或
 * `Process`，三种都要拦住。
 */
export const shouldIgnoreEnterForIme = (e: ReactKeyboardEvent): boolean => {
  const nativeEvent = e.nativeEvent as KeyboardEvent
  return (
    nativeEvent.isComposing ||
    nativeEvent.keyCode === 229 ||
    e.key === 'Process'
  )
}
