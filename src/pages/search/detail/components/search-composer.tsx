import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Sender } from '@ant-design/x'
import type { SenderRef } from '@ant-design/x/es/sender'
import { AudioLines, ChevronDown, MicOff, Sparkles, WandSparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'

interface BrowserSpeechRecognitionResult {
  isFinal: boolean
  [index: number]: { transcript: string }
}

interface BrowserSpeechRecognitionEvent extends Event {
  resultIndex: number
  results: ArrayLike<BrowserSpeechRecognitionResult>
}

interface BrowserSpeechRecognitionErrorEvent extends Event {
  error?: string
}

interface BrowserSpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognitionInstance

type BrowserWindow = Window & {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor
}

interface SearchComposerProps {
  onSearch: (query: string) => void
  onStop: () => void
  isSearching: boolean
  placeholder?: string
  variant?: 'hero' | 'dock'
  enableSemanticMode?: boolean
  prefillText?: string
  prefillVersion?: number
}

const SCOPE_OPTIONS = ['当前应用知识库', '全部已授权知识库'] as const

const ScopeSelector: React.FC<{
  value: string
  onChange: (value: string) => void
}> = memo(({ value, onChange }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="scope-selector-wrapper">
      <button
        type="button"
        className="scope-selector-trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{value}</span>
        <ChevronDown className={cn('scope-selector-arrow', open && 'scope-selector-arrow-open')} />
      </button>
      {open && (
        <div className="scope-selector-dropdown">
          {SCOPE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              className={cn('scope-selector-option', opt === value && 'scope-selector-option-active')}
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

ScopeSelector.displayName = 'ScopeSelector'

const SearchComposer: React.FC<SearchComposerProps> = ({
  onSearch,
  onStop,
  isSearching,
  placeholder = '输入问题并回车发送，Shift+Enter 换行',
  variant = 'dock',
  enableSemanticMode = true,
  prefillText,
  prefillVersion,
}) => {
  const senderRef = useRef<SenderRef | null>(null)
  const speechRecognitionRef = useRef<BrowserSpeechRecognitionInstance | null>(null)
  const [value, setValue] = useState('')
  const [semanticMode, setSemanticMode] = useState(false)
  const [scope, setScope] = useState<string>(SCOPE_OPTIONS[0])
  const [recording, setRecording] = useState(false)

  const getSpeechRecognitionConstructor = useCallback(() => {
    const browserWindow = window as BrowserWindow
    return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition
  }, [])

  const appendSpeechText = useCallback((transcript: string) => {
    const nextText = transcript.trim()
    if (!nextText) return
    setValue((prev) => (prev.trim() ? `${prev} ${nextText}` : nextText))
  }, [])

  const stopSpeechRecognition = useCallback(() => {
    speechRecognitionRef.current?.stop()
    setRecording(false)
  }, [])

  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition = getSpeechRecognitionConstructor()
    if (!SpeechRecognition) {
      toast.error('当前浏览器不支持语音输入，请使用 Chrome 或 Edge')
      setRecording(false)
      return
    }

    const recognition = speechRecognitionRef.current || new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'zh-CN'

    recognition.onstart = () => {
      setRecording(true)
    }

    recognition.onresult = (event) => {
      let transcript = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript || ''
      }
      appendSpeechText(transcript)
    }

    recognition.onerror = (event) => {
      setRecording(false)
      if (event.error === 'not-allowed') {
        toast.error('麦克风权限未开启，无法执行语音转文本')
        return
      }
      toast.error('语音识别失败，请重试')
    }

    recognition.onend = () => {
      setRecording(false)
    }

    speechRecognitionRef.current = recognition

    try {
      recognition.start()
    } catch {
      setRecording(false)
      toast.error('语音识别启动失败，请稍后重试')
    }
  }, [appendSpeechText, getSpeechRecognitionConstructor])

  const handleRecordingChange = useCallback(
    (nextRecording: boolean) => {
      if (nextRecording) {
        startSpeechRecognition()
      } else {
        stopSpeechRecognition()
      }
    },
    [startSpeechRecognition, stopSpeechRecognition]
  )

  const handleSenderSubmit = useCallback(
    (message: string) => {
      const next = message.trim()
      if (!next || isSearching) return

      if (enableSemanticMode && semanticMode) {
        onSearch(`在 ${scope} 范围内，深度检索并回答：${next}`)
      } else {
        onSearch(next)
      }
      setValue('')
    },
    [enableSemanticMode, isSearching, onSearch, semanticMode, scope]
  )

  const senderPlaceholder = useMemo(() => {
    if (enableSemanticMode && semanticMode) {
      return '输入你想检索的问题'
    }
    return placeholder
  }, [enableSemanticMode, placeholder, semanticMode])

  const semanticPrefix = useMemo(() => {
    if (!enableSemanticMode || !semanticMode) return undefined
    return (
      <div className="semantic-prefix">
        <span className="semantic-prefix-text">在</span>
        <ScopeSelector value={scope} onChange={setScope} />
        <span className="semantic-prefix-text">范围内，深度检索并回答：</span>
      </div>
    )
  }, [enableSemanticMode, semanticMode, scope])

  useEffect(() => {
    return () => {
      stopSpeechRecognition()
    }
  }, [stopSpeechRecognition])

  useEffect(() => {
    if (!prefillVersion || !prefillText) return
    setSemanticMode(false)
    setValue(prefillText)
    requestAnimationFrame(() => {
      senderRef.current?.focus?.()
    })
  }, [prefillText, prefillVersion])

  return (
    <div
      className={cn(
        'search-composer-area',
        semanticMode && 'search-composer-semantic',
        variant === 'hero'
          ? 'search-composer-hero'
          : 'search-composer-dock rounded-radius-xl border border-border-default bg-surface-primary p-space-sm'
      )}
    >
      <style>{`
        .search-composer-hero {
          padding: 0 !important;
        }

        .search-composer-area .ant-sender {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }

        .search-composer-area .ant-sender-content {
          background: var(--color-components-input-bg) !important;
          border: 1px solid var(--color-components-input-border) !important;
          border-radius: 14px !important;
          padding: 10px 12px !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
          display: flex !important;
          align-items: flex-end !important;
          gap: 8px !important;
        }

        /* 语义模式：prefix 在上方，input + suffix 在下方 */
        .search-composer-semantic .ant-sender-content {
          display: grid !important;
          grid-template-columns: 1fr auto !important;
          grid-template-rows: auto 1fr !important;
          align-items: end !important;
          gap: 6px 8px !important;
        }

        .search-composer-semantic .ant-sender-prefix {
          grid-column: 1 / -1 !important;
          padding-bottom: 4px !important;
          border-bottom: 1px solid var(--color-border-default) !important;
          margin-bottom: 2px !important;
        }

        .search-composer-area .ant-sender-content > *:first-child {
          flex: 1 1 auto !important;
          min-width: 0 !important;
        }

        .search-composer-semantic .ant-sender-content > *:first-child {
          flex: unset !important;
        }

        .search-composer-area .ant-sender-actions-list {
          margin-left: auto !important;
        }

        .search-composer-hero .ant-sender-content {
          border-radius: clamp(24px, 3vw, 32px) !important;
          padding: 14px 18px !important;
        }

        .search-composer-area .ant-sender:focus-within .ant-sender-content {
          border-color: var(--color-border-accent) !important;
          box-shadow: 0 0 0 2px var(--color-state-focus-10) !important;
        }

        .search-composer-area .ant-sender textarea,
        .search-composer-area .ant-sender input,
        .search-composer-area .ant-sender .ant-input {
          color: var(--color-components-input-text) !important;
          background: transparent !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
          width: 100% !important;
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }

        .search-composer-area .ant-sender textarea {
          white-space: pre-wrap !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
        }

        .search-composer-area .ant-sender textarea:focus,
        .search-composer-area .ant-sender textarea:focus-visible,
        .search-composer-area .ant-sender input:focus,
        .search-composer-area .ant-sender input:focus-visible,
        .search-composer-area .ant-sender .ant-input:focus,
        .search-composer-area .ant-sender .ant-input:focus-visible {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }

        .search-composer-area .ant-sender textarea::placeholder,
        .search-composer-area .ant-sender input::placeholder {
          color: var(--color-components-input-text-placeholder) !important;
        }

        .search-composer-area .ant-sender-actions-btn {
          border-radius: 9999px !important;
          border: none !important;
          width: 36px !important;
          height: 36px !important;
          background: var(--color-components-button-primary-bg) !important;
          color: var(--color-components-button-primary-text) !important;
        }

        .search-composer-area .ant-sender-actions-btn:hover {
          background: var(--color-components-button-primary-bg-hover) !important;
        }

        .search-composer-area .ant-sender-actions-btn:disabled {
          background: var(--color-components-button-primary-bg-disabled) !important;
          color: var(--color-components-button-primary-text-disabled) !important;
        }

        .search-composer-hero .ant-sender-footer {
          margin-top: 12px !important;
        }

        /* 语义前缀栏 */
        .semantic-prefix {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
          font-size: 14px;
          line-height: 1.6;
          color: var(--color-text-secondary);
        }

        .semantic-prefix-text {
          white-space: nowrap;
        }

        /* 范围选择器 */
        .scope-selector-wrapper {
          position: relative;
          display: inline-flex;
        }

        .scope-selector-trigger {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: var(--color-components-select-bg);
          border: 1px solid var(--color-components-select-border);
          color: var(--color-text-primary);
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 14px;
          line-height: 1.6;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
          white-space: nowrap;
        }

        .scope-selector-trigger:hover {
          border-color: var(--color-state-focus);
          color: var(--color-state-focus);
        }

        .scope-selector-arrow {
          width: 14px;
          height: 14px;
          color: var(--color-text-tertiary);
          transition: transform 0.2s, color 0.2s;
          flex-shrink: 0;
        }

        .scope-selector-trigger:hover .scope-selector-arrow {
          color: var(--color-state-focus);
        }

        .scope-selector-arrow-open {
          transform: rotate(180deg);
        }

        .scope-selector-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          z-index: 1050;
          min-width: 100%;
          background: var(--color-components-dropdown-bg);
          border: 1px solid var(--color-components-dropdown-border);
          border-radius: 8px;
          padding: 4px;
          box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12);
        }

        .scope-selector-option {
          display: block;
          width: 100%;
          text-align: left;
          padding: 5px 12px;
          border: none;
          background: transparent;
          color: var(--color-components-dropdown-item-text);
          font-size: 14px;
          line-height: 1.6;
          border-radius: 4px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s;
        }

        .scope-selector-option:hover {
          background: var(--color-components-dropdown-item-bg-hover);
        }

        .scope-selector-option-active {
          background: var(--color-state-focus-10);
          color: var(--color-state-focus);
        }

        /* Sender.Switch 模式开关 - 统一风格，遵循语义令牌 */
        .search-composer-area .ant-sender-switch .ant-btn,
        .search-composer-area .ant-sender-switch-checked .ant-btn {
          background: var(--color-surface-primary) !important;
          border-color: var(--color-border-default) !important;
          color: var(--color-text-secondary) !important;
          box-shadow: none !important;
        }

        .search-composer-area .ant-sender-switch .ant-btn:not(:disabled):hover,
        .search-composer-area .ant-sender-switch-checked .ant-btn:not(:disabled):hover {
          background: var(--color-state-focus-10) !important;
          border-color: var(--color-state-focus) !important;
          color: var(--color-state-focus) !important;
          box-shadow: none !important;
        }

        /* Dropdown menu 下拉菜单 - 遵循语义令牌 */
        .ant-dropdown .ant-dropdown-menu {
          background: var(--color-components-dropdown-bg) !important;
          border: 1px solid var(--color-components-dropdown-border) !important;
          box-shadow: var(--color-components-dropdown-shadow) !important;
        }

        .ant-dropdown .ant-dropdown-menu-item {
          color: var(--color-components-dropdown-item-text) !important;
        }

        .ant-dropdown .ant-dropdown-menu-item:hover,
        .ant-dropdown .ant-dropdown-menu-item-active {
          background: var(--color-components-dropdown-item-bg-hover) !important;
        }

        .ant-dropdown .ant-dropdown-menu-item-selected {
          background: var(--color-state-focus-10) !important;
          color: var(--color-state-focus) !important;
        }
      `}</style>

      <Sender
        ref={senderRef}
        value={value}
        onChange={setValue}
        onSubmit={handleSenderSubmit}
        onCancel={onStop}
        loading={isSearching}
        submitType="enter"
        autoSize={{ minRows: 1, maxRows: 6 }}
        placeholder={senderPlaceholder}
        prefix={semanticPrefix}
        allowSpeech={{
          recording,
          onRecordingChange: handleRecordingChange,
        }}
        suffix={(_, { components }) => (
          <div className="ml-auto flex items-center gap-space-xs">
            <components.SpeechButton />
            {isSearching ? <components.LoadingButton /> : <components.SendButton />}
          </div>
        )}
        footer={
          <div className="flex items-center justify-between gap-space-sm text-xs text-text-tertiary flex-wrap mt-space-xs">
            <div className="flex items-center gap-space-sm">
              {enableSemanticMode ? (
                <Sender.Switch
                  value={semanticMode}
                  onChange={(checked) => setSemanticMode(checked)}
                  icon={semanticMode ? <WandSparkles className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  checkedChildren="语义输入"
                  unCheckedChildren="普通输入"
                />
              ) : null}
              <span className="inline-flex items-center gap-1 rounded-radius-full bg-surface-secondary px-space-xs py-0.5 text-xs text-text-secondary">
                {recording ? <AudioLines className="h-3.5 w-3.5 text-text-success" /> : <MicOff className="h-3.5 w-3.5" />}
                {recording ? '语音识别中' : '支持语音转文本'}
              </span>
            </div>
            <span>{enableSemanticMode ? `${semanticMode ? '语义模式' : '普通文本模式'} · Enter 发送` : 'Enter 发送'}</span>
          </div>
        }
        styles={{
          content: {
            padding: 0,
          },
          input: {
            minHeight: variant === 'hero' ? 64 : 52,
            color: 'var(--color-text-primary)',
          },
          suffix: {
            marginInlineStart: 8,
          },
        }}
      />
    </div>
  )
}

export default memo(SearchComposer)
