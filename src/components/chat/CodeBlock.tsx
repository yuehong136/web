import { memo, useCallback, useRef, useState } from 'react'
import { useShikiHighlighter } from 'react-shiki'
import { Check, Copy } from 'lucide-react'
import { cn, copyToClipboard } from '@/lib/utils'
import { CODE_THEMES, shikiEngine } from './shiki-engine'
import './code-block.css'

export interface CodeBlockProps {
  /** 代码文本 */
  code: string
  /** 语言标识（如 ts、python、json），未知语言会降级为纯文本 */
  language?: string
  /** 是否显示顶部「语言标签 + 复制」头部，默认显示 */
  showHeader?: boolean
  /** 流式输出时开启节流，降低高频高亮开销 */
  streaming?: boolean
  className?: string
}

const FALLBACK_LANGUAGE = 'text'

/**
 * 基于 Shiki（react-shiki）的代码块组件。
 *
 * - VS Code 级 TextMate 高亮，质量与主流现代 AI 产品一致；
 * - 语言按需动态加载，未知语言安全降级（见 shiki-engine 的 forgiving）；
 * - 双主题 + 纯 CSS 暗色切换；
 * - 流式场景通过 delay 节流，适配大模型逐 token 输出。
 */
export const CodeBlock = memo(function CodeBlock({
  code,
  language,
  showHeader = true,
  streaming = false,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const normalizedLanguage = (language || FALLBACK_LANGUAGE).toLowerCase()

  const highlighted = useShikiHighlighter(
    code,
    normalizedLanguage,
    CODE_THEMES,
    {
      engine: shikiEngine,
      defaultColor: 'light',
      delay: streaming ? 120 : 0,
    },
  )

  const handleCopy = useCallback(() => {
    copyToClipboard(code)
    setCopied(true)
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopied(false), 1500)
  }, [code])

  return (
    <div
      className={cn(
        'code-block bg-surface-primary group relative my-2 overflow-hidden rounded-lg border border-border-default',
        className,
      )}
    >
      {showHeader && (
        <div className="bg-surface-secondary flex items-center justify-between border-b border-border-default px-3 py-1.5">
          <span className="font-mono text-xs lowercase text-text-tertiary">
            {normalizedLanguage}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="hover:bg-surface-primary flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-text-tertiary transition-colors hover:text-text-secondary"
            aria-label="复制代码"
          >
            {copied ? (
              <>
                <Check className="size-3.5" /> 已复制
              </>
            ) : (
              <>
                <Copy className="size-3.5" /> 复制
              </>
            )}
          </button>
        </div>
      )}
      <div className="code-block-body">
        {highlighted ?? (
          <pre className="m-0 overflow-x-auto px-3.5 py-3 text-[13px] leading-relaxed">
            <code className="font-mono text-text-primary">{code}</code>
          </pre>
        )}
      </div>
    </div>
  )
})

CodeBlock.displayName = 'CodeBlock'

export default CodeBlock
