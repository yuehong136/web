import './search-composer.css'
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Sender } from '@ant-design/x'
import {
  AudioLines,
  ChevronDown,
  MicOff,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
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

type BrowserSpeechRecognitionConstructor =
  new () => BrowserSpeechRecognitionInstance

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
        <ChevronDown
          className={cn(
            'scope-selector-arrow',
            open && 'scope-selector-arrow-open',
          )}
        />
      </button>
      {open && (
        <div className="scope-selector-dropdown">
          {SCOPE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              className={cn(
                'scope-selector-option',
                opt === value && 'scope-selector-option-active',
              )}
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
  const senderRef = useRef<React.ElementRef<typeof Sender> | null>(null)
  const speechRecognitionRef = useRef<BrowserSpeechRecognitionInstance | null>(
    null,
  )
  const [value, setValue] = useState('')
  const [semanticMode, setSemanticMode] = useState(false)
  const [scope, setScope] = useState<string>(SCOPE_OPTIONS[0])
  const [recording, setRecording] = useState(false)

  const getSpeechRecognitionConstructor = useCallback(() => {
    const browserWindow = window as BrowserWindow
    return (
      browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition
    )
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

    if (!speechRecognitionRef.current) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = 'zh-CN'

      recognition.onstart = () => {
        setRecording(true)
      }

      recognition.onresult = (event) => {
        let transcript = ''
        for (
          let index = event.resultIndex;
          index < event.results.length;
          index += 1
        ) {
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
    }
    const recognition = speechRecognitionRef.current

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
    [startSpeechRecognition, stopSpeechRecognition],
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
    [enableSemanticMode, isSearching, onSearch, semanticMode, scope],
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

  const [previousPrefill, setPreviousPrefill] = useState({
    prefillText,
    prefillVersion,
  })
  if (
    previousPrefill.prefillText !== prefillText ||
    previousPrefill.prefillVersion !== prefillVersion
  ) {
    setPreviousPrefill({ prefillText, prefillVersion })
    if (prefillVersion && prefillText) {
      setSemanticMode(false)
      setValue(prefillText)
    }
  }
  useEffect(() => {
    if (!prefillVersion || !prefillText) return
    const frame = requestAnimationFrame(() => senderRef.current?.focus?.())
    return () => cancelAnimationFrame(frame)
  }, [prefillText, prefillVersion])

  return (
    <div
      className={cn(
        'search-composer-area',
        semanticMode && 'search-composer-semantic',
        variant === 'hero'
          ? 'search-composer-hero'
          : 'search-composer-dock rounded-radius-xl bg-surface-primary p-space-sm border border-border-default',
      )}
    >
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
          <div className="gap-space-xs ml-auto flex items-center">
            <components.SpeechButton />
            {isSearching ? (
              <components.LoadingButton />
            ) : (
              <components.SendButton />
            )}
          </div>
        )}
        footer={
          <div className="gap-space-sm mt-space-xs flex flex-wrap items-center justify-between text-xs text-text-tertiary">
            <div className="gap-space-sm flex items-center">
              {enableSemanticMode ? (
                <Sender.Switch
                  value={semanticMode}
                  onChange={(checked) => setSemanticMode(checked)}
                  icon={
                    semanticMode ? (
                      <WandSparkles className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )
                  }
                  checkedChildren="语义输入"
                  unCheckedChildren="普通输入"
                />
              ) : null}
              <span className="rounded-radius-full bg-surface-secondary px-space-xs inline-flex items-center gap-1 py-0.5 text-xs text-text-secondary">
                {recording ? (
                  <AudioLines className="h-3.5 w-3.5 text-text-success" />
                ) : (
                  <MicOff className="h-3.5 w-3.5" />
                )}
                {recording ? '语音识别中' : '支持语音转文本'}
              </span>
            </div>
            <span>
              {enableSemanticMode
                ? `${semanticMode ? '语义模式' : '普通文本模式'} · Enter 发送`
                : 'Enter 发送'}
            </span>
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
