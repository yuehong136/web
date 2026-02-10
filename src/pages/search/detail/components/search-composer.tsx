import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Sender } from '@ant-design/x'
import type { SenderRef, SlotConfigType } from '@ant-design/x/es/sender'
import { AudioLines, MicOff, Sparkles, WandSparkles } from 'lucide-react'
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
  prefillText?: string
  prefillVersion?: number
}

const SEMANTIC_SLOT_CONFIG: SlotConfigType[] = [
  {
    type: 'text',
    value: '在',
  },
  {
    type: 'select',
    key: 'scope',
    props: {
      options: ['当前应用知识库', '全部已授权知识库'],
      defaultValue: '当前应用知识库',
    },
    formatResult: (value: unknown) => String(value || '当前应用知识库'),
  },
  {
    type: 'text',
    value: '范围内，深度检索并回答：',
  },
  {
    type: 'input',
    key: 'query',
    props: {
      placeholder: '输入你想检索的问题',
    },
    formatResult: (value: unknown) => String(value || '').trim(),
  },
]

const SearchComposer: React.FC<SearchComposerProps> = ({
  onSearch,
  onStop,
  isSearching,
  placeholder = '输入问题并回车发送，Shift+Enter 换行',
  variant = 'dock',
  prefillText,
  prefillVersion,
}) => {
  const senderRef = useRef<SenderRef | null>(null)
  const speechRecognitionRef = useRef<BrowserSpeechRecognitionInstance | null>(null)
  const [value, setValue] = useState('')
  const [semanticMode, setSemanticMode] = useState(false)
  const [semanticKey, setSemanticKey] = useState(0)
  const [recording, setRecording] = useState(false)

  const getSpeechRecognitionConstructor = useCallback(() => {
    const browserWindow = window as BrowserWindow
    return browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition
  }, [])

  const appendSpeechText = useCallback(
    (transcript: string) => {
      const nextText = transcript.trim()
      if (!nextText) return

      if (semanticMode) {
        senderRef.current?.insert?.(nextText)
        return
      }

      setValue((prev) => (prev.trim() ? `${prev} ${nextText}` : nextText))
    },
    [semanticMode]
  )

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
      onSearch(next)
      if (semanticMode) {
        setSemanticKey((prev) => prev + 1)
      } else {
        setValue('')
      }
    },
    [isSearching, onSearch, semanticMode]
  )

  const senderPlaceholder = useMemo(() => {
    if (semanticMode) {
      return '使用结构化语义输入组织检索问题'
    }
    return placeholder
  }, [placeholder, semanticMode])

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

        .search-composer-area .ant-sender-content > *:first-child {
          flex: 1 1 auto !important;
          min-width: 0 !important;
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

        /* Slot select 下拉选择器 - 遵循语义令牌 */
        .search-composer-area .ant-sender-slot-select {
          background: var(--color-components-select-bg) !important;
          border: 1px solid var(--color-components-select-border) !important;
          color: var(--color-text-primary) !important;
          border-radius: 6px !important;
          padding: 2px 6px !important;
        }

        .search-composer-area .ant-sender-slot-select:hover,
        .search-composer-area .ant-sender-slot-select.ant-dropdown-trigger-open {
          border-color: var(--color-state-focus) !important;
          color: var(--color-state-focus) !important;
        }

        .search-composer-area .ant-sender-slot-select .ant-sender-slot-select-arrow {
          color: var(--color-text-tertiary) !important;
        }

        .search-composer-area .ant-sender-slot-select:hover .ant-sender-slot-select-arrow,
        .search-composer-area .ant-sender-slot-select.ant-dropdown-trigger-open .ant-sender-slot-select-arrow {
          color: var(--color-state-focus) !important;
        }

        /* Slot input 输入框 - 遵循语义令牌 */
        .search-composer-area .ant-input.ant-sender-slot-input {
          background: var(--color-components-input-bg) !important;
          border: 1px solid var(--color-components-input-border) !important;
          color: var(--color-components-input-text) !important;
        }

        .search-composer-area .ant-input.ant-sender-slot-input:hover,
        .search-composer-area .ant-input.ant-sender-slot-input:focus {
          border-color: var(--color-components-input-border-focus) !important;
        }

        .search-composer-area .ant-input.ant-sender-slot-input::placeholder {
          color: var(--color-components-input-text-placeholder) !important;
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

        /* Slot tag 标签 - 遵循语义令牌 */
        .search-composer-area .ant-sender-slot-tag {
          background: var(--color-components-tag-bg) !important;
          border-color: var(--color-components-tag-border) !important;
          color: var(--color-components-tag-text) !important;
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
        key={semanticMode ? `semantic-${semanticKey}` : 'plain'}
        ref={senderRef}
        value={semanticMode ? undefined : value}
        slotConfig={semanticMode ? SEMANTIC_SLOT_CONFIG : undefined}
        onChange={(nextValue) => {
          if (semanticMode) return
          setValue(nextValue)
        }}
        onSubmit={handleSenderSubmit}
        onCancel={onStop}
        loading={isSearching}
        submitType="enter"
        autoSize={{ minRows: 1, maxRows: 6 }}
        placeholder={senderPlaceholder}
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
              <Sender.Switch
                value={semanticMode}
                onChange={(checked) => setSemanticMode(checked)}
                icon={semanticMode ? <WandSparkles className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                checkedChildren="语义输入"
                unCheckedChildren="普通输入"
              />
              <span className="inline-flex items-center gap-1 rounded-radius-full bg-surface-secondary px-space-xs py-0.5 text-xs text-text-secondary">
                {recording ? <AudioLines className="h-3.5 w-3.5 text-text-success" /> : <MicOff className="h-3.5 w-3.5" />}
                {recording ? '语音识别中' : '支持语音转文本'}
              </span>
            </div>
            <span>{semanticMode ? '词槽语义模式' : '普通文本模式'} · Enter 发送</span>
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
