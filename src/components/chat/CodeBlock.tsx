import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Maximize2,
  WrapText,
} from 'lucide-react'
import { toast } from '@/lib/toast'
import { cn, copyToClipboard } from '@/lib/utils'
import { downloadTextFile } from '@/lib/download'
import { CodeHighlight } from '@/components/chat/code-highlight'
import { MessageAction } from '@/components/patterns/chat/message'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import './code-block.css'
import { useResolvedAppearance, useThemeScope } from '@/themes'

export interface CodeBlockProps {
  /** 代码文本 */
  code: string
  /** 语言标识（如 ts、python、json），未知语言会降级为纯文本 */
  language?: string
  /** 是否显示顶部「语言标签 + 工具条」头部，默认显示 */
  showHeader?: boolean
  /** 流式输出时开启节流，降低高频高亮开销 */
  streaming?: boolean
  /** Longer code folds to this many lines until expanded; 0 never folds. */
  foldAfter?: number
  className?: string
}

const FALLBACK_LANGUAGE = 'text'

/** File extensions for the download, by highlighter language id. */
const EXTENSIONS: Record<string, string> = {
  bash: 'sh',
  c: 'c',
  'c++': 'cpp',
  cpp: 'cpp',
  cs: 'cs',
  csharp: 'cs',
  css: 'css',
  go: 'go',
  html: 'html',
  java: 'java',
  javascript: 'js',
  js: 'js',
  json: 'json',
  jsx: 'jsx',
  kotlin: 'kt',
  markdown: 'md',
  md: 'md',
  php: 'php',
  py: 'py',
  python: 'py',
  rb: 'rb',
  ruby: 'rb',
  rust: 'rs',
  rs: 'rs',
  sh: 'sh',
  shell: 'sh',
  sql: 'sql',
  svg: 'svg',
  swift: 'swift',
  ts: 'ts',
  tsx: 'tsx',
  typescript: 'ts',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  zsh: 'sh',
}

export const codeFileExtension = (language: string) =>
  EXTENSIONS[language] ?? 'txt'

const lineCount = (code: string) => code.replace(/\n$/, '').split('\n').length

/**
 * 基于 Shiki（react-shiki）的代码块组件。
 *
 * - VS Code 级 TextMate 高亮，语言按需动态加载，未知语言安全降级；
 * - 双主题 + 纯 CSS 暗色切换；流式场景通过 delay 节流；
 * - The header sticks while a long block scrolls past and carries the same
 *   tools as answer tables: wrap long lines, download as a file, view full
 *   size, copy. While streaming it shows the language and a live line count;
 *   the tools appear once the code is complete. Blocks longer than
 *   `foldAfter` lines fold, with a control to show the rest.
 */
export const CodeBlock = memo(function CodeBlock({
  code,
  language,
  showHeader = true,
  streaming = false,
  foldAfter = 30,
  className,
}: CodeBlockProps) {
  const { t } = useTranslation()
  const rootAppearance = useResolvedAppearance()
  const scope = useThemeScope()
  const appearance = scope?.appearance ?? rootAppearance
  const [copied, setCopied] = useState(false)
  const [wrap, setWrap] = useState(false)
  const [unfolded, setUnfolded] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const expandButton = useRef<HTMLButtonElement>(null)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    },
    [],
  )
  const normalizedLanguage = (language || FALLBACK_LANGUAGE).toLowerCase()
  const lines = lineCount(code)
  const folded = !streaming && foldAfter > 0 && lines > foldAfter && !unfolded

  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(code)
      setCopied(true)
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
      toast.error(t('common.copyFailed', '复制失败'))
    }
  }, [code, t])

  return (
    <div
      data-code-mode={appearance.resolvedMode}
      data-code-preset={appearance.preset}
      data-wrap={wrap || undefined}
      data-folded={folded || undefined}
      style={{ '--code-fold-lines': foldAfter } as React.CSSProperties}
      className={cn(
        // clip, not hidden: a hidden overflow would trap the sticky header.
        'code-block group relative my-2 overflow-clip rounded-lg border border-line-subtle bg-code-bg text-code-fg',
        className,
      )}
    >
      {showHeader && (
        // Opaque: code scrolls under the sticky header.
        <div className="code-block-header sticky top-0 z-[1] flex min-h-[var(--control-height)] items-center justify-between gap-space-sm border-b border-line-subtle bg-code-bg [background-image:linear-gradient(var(--color-fill-muted),var(--color-fill-muted))] ps-space-md pe-space-xs">
          <span className="flex min-w-0 items-baseline gap-space-sm font-mono text-xs text-fg-subtle">
            <span className="lowercase">{normalizedLanguage}</span>
            {streaming && (
              <span className="tabular-nums" data-code-lines>
                {t('chat.code.lines', { count: lines })}
              </span>
            )}
          </span>
          {!streaming && (
            <div className="flex shrink-0 items-center">
              <MessageAction
                label={t('chat.code.wrap')}
                aria-pressed={wrap}
                onClick={() => setWrap((value) => !value)}
                className={wrap ? 'bg-fill-pressed text-fg' : undefined}
              >
                <WrapText />
              </MessageAction>
              <MessageAction
                label={t('chat.code.download')}
                onClick={() =>
                  downloadTextFile(
                    code,
                    t('chat.code.filename', {
                      ext: codeFileExtension(normalizedLanguage),
                    }),
                  )
                }
              >
                <Download />
              </MessageAction>
              <MessageAction
                ref={expandButton}
                label={t('chat.code.expand')}
                onClick={() => setExpanded(true)}
              >
                <Maximize2 />
              </MessageAction>
              <MessageAction
                label={copied ? t('common.copied') : t('common.copy', '复制')}
                onClick={() => void handleCopy()}
              >
                {copied ? <Check /> : <Copy />}
              </MessageAction>
            </div>
          )}
        </div>
      )}
      <div className="code-block-body">
        <CodeHighlight
          code={code}
          language={normalizedLanguage}
          streaming={streaming}
        />
      </div>
      {!streaming && foldAfter > 0 && lines > foldAfter && (
        <button
          type="button"
          className="code-block-fold flex w-full items-center justify-center gap-space-xs border-t border-line-subtle py-space-xs text-xs text-fg-muted transition-colors hover:bg-fill-hover hover:text-fg"
          aria-expanded={!folded}
          onClick={() => setUnfolded((value) => !value)}
        >
          {folded ? (
            <>
              <ChevronDown className="size-icon-xs" aria-hidden="true" />
              {t('chat.code.showRest', { count: lines - foldAfter })}
            </>
          ) : (
            <>
              <ChevronUp className="size-icon-xs" aria-hidden="true" />
              {t('chat.code.fold')}
            </>
          )}
        </button>
      )}
      {expanded && (
        <Dialog open onOpenChange={setExpanded}>
          <DialogContent size="full" modal returnFocusRef={expandButton}>
            <DialogHeader>
              <DialogTitle className="font-mono lowercase">
                {normalizedLanguage}
              </DialogTitle>
            </DialogHeader>
            <DialogBody>
              <div
                data-code-mode={appearance.resolvedMode}
                data-wrap={wrap || undefined}
                className="code-block overflow-clip rounded-lg border border-line-subtle bg-code-bg text-code-fg"
              >
                <CodeHighlight
                  code={code}
                  language={normalizedLanguage}
                  streaming={false}
                />
              </div>
            </DialogBody>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
})

CodeBlock.displayName = 'CodeBlock'

export default CodeBlock
