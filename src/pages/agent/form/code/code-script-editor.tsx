import { configureMonacoLoader } from '@/components/jsonjoy-builder/lib/configure-monaco-loader'
import { useMonacoTheme } from '@/components/jsonjoy-builder/hooks/use-monaco-theme'
import { Button } from '@/components/ui/button'
import {
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import MonacoEditor, {
  type BeforeMount,
  type OnMount,
} from '@monaco-editor/react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { Code2, Loader2, Maximize2, Minimize2 } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  createCodeEditorOptions,
  getCodeLanguageLabel,
  getCodeLineCount,
} from './code-editor-config'
import type { ProgrammingLanguageValue } from './types'
import { useExpandedEditorFocus } from './use-expanded-editor-focus'

configureMonacoLoader()

interface CodeScriptEditorProps {
  value: string
  language: ProgrammingLanguageValue
  onChange: (value: string) => void
  onBlur?: () => void
}

interface EditorActionTooltipProps {
  label: string
  children: ReactNode
}

function EditorActionTooltip({ label, children }: EditorActionTooltipProps) {
  return (
    <TooltipRoot>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipPrimitive.Portal>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </TooltipPrimitive.Portal>
    </TooltipRoot>
  )
}

export function CodeScriptEditor({
  value,
  language,
  onChange,
  onBlur,
}: CodeScriptEditorProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const { currentTheme, defineMonacoThemes } = useMonacoTheme()
  const monacoRef = useRef<Parameters<BeforeMount>[0] | null>(null)
  const inlineBlurSubscriptionRef = useRef<{ dispose: () => void } | null>(null)
  const expandedBlurSubscriptionRef = useRef<{ dispose: () => void } | null>(
    null,
  )
  const { expandedContentRef, focusExpandedEditor, registerExpandedEditor } =
    useExpandedEditorFocus(isExpanded)
  const languageLabel = getCodeLanguageLabel(language)
  const editorAriaLabel = t(
    'flow.codeEditorAriaLabel',
    '{{language}} code editor',
    { language: languageLabel },
  )
  const lineCount = useMemo(() => getCodeLineCount(value), [value])
  const editorOptions = useMemo(
    () => createCodeEditorOptions({ ariaLabel: editorAriaLabel, language }),
    [editorAriaLabel, language],
  )

  const handleBeforeMount = useCallback<BeforeMount>(
    (monaco) => {
      monacoRef.current = monaco
      defineMonacoThemes(monaco)
      monaco.editor.setTheme(currentTheme)
    },
    [currentTheme, defineMonacoThemes],
  )

  const handleInlineMount = useCallback<OnMount>(
    (editor, monaco) => {
      monacoRef.current = monaco
      monaco.editor.setTheme(currentTheme)
      inlineBlurSubscriptionRef.current?.dispose()
      inlineBlurSubscriptionRef.current = editor.onDidBlurEditorWidget(() =>
        onBlur?.(),
      )
    },
    [currentTheme, onBlur],
  )

  const handleExpandedMount = useCallback<OnMount>(
    (editor, monaco) => {
      registerExpandedEditor(editor)
      monacoRef.current = monaco
      monaco.editor.setTheme(currentTheme)
      expandedBlurSubscriptionRef.current?.dispose()
      expandedBlurSubscriptionRef.current = editor.onDidBlurEditorWidget(() =>
        onBlur?.(),
      )
    },
    [currentTheme, onBlur, registerExpandedEditor],
  )

  useEffect(() => {
    monacoRef.current?.editor.setTheme(currentTheme)
  }, [currentTheme])

  useEffect(
    () => () => {
      inlineBlurSubscriptionRef.current?.dispose()
      expandedBlurSubscriptionRef.current?.dispose()
    },
    [],
  )

  const loading = (
    <output
      className="gap-space-sm bg-surface-secondary flex h-full items-center justify-center text-sm text-text-secondary"
      aria-live="polite"
    >
      <Loader2 className="size-icon-md animate-spin" />
      {t('flow.codeEditorLoading', 'Loading code editor…')}
    </output>
  )

  return (
    <TooltipProvider delayDuration={300}>
      <DialogPrimitive.Root open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="rounded-radius-lg bg-surface-primary shadow-elevation-low overflow-hidden border border-border-default">
          <div className="px-space-sm py-space-xs bg-surface-secondary flex items-center justify-between border-b border-border-subtle">
            <div className="gap-space-sm flex min-w-0 items-center">
              <Code2 className="size-icon-sm shrink-0 text-text-secondary" />
              <span className="text-sm font-medium text-text-primary">
                {t('flow.code', 'Code')}
              </span>
              <span className="rounded-radius-sm px-space-xs py-space-xs bg-surface-primary border border-border-subtle text-xs font-medium text-text-secondary">
                {languageLabel}
              </span>
            </div>

            <TooltipRoot>
              <TooltipTrigger asChild>
                <DialogPrimitive.Trigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t(
                      'flow.codeEditorExpand',
                      'Open wide code editor',
                    )}
                  >
                    <Maximize2 className="size-icon-sm" />
                  </Button>
                </DialogPrimitive.Trigger>
              </TooltipTrigger>
              <TooltipPrimitive.Portal>
                <TooltipContent side="left">
                  {t('flow.codeEditorExpand', 'Open wide code editor')}
                </TooltipContent>
              </TooltipPrimitive.Portal>
            </TooltipRoot>
          </div>

          <MonacoEditor
            height={320}
            language={language}
            value={value}
            theme={currentTheme}
            beforeMount={handleBeforeMount}
            onMount={handleInlineMount}
            onChange={(nextValue) => onChange(nextValue ?? '')}
            loading={loading}
            options={editorOptions}
          />
        </div>

        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm" />
          <DialogPrimitive.Content
            ref={expandedContentRef}
            tabIndex={-1}
            className="rounded-radius-lg bg-surface-primary shadow-elevation-high fixed left-1/2 top-1/2 z-[71] flex h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-[1600px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-border-default focus:outline-none xl:h-[90vh] xl:w-[90vw]"
            onOpenAutoFocus={(event) => {
              event.preventDefault()
              expandedContentRef.current?.focus()
              focusExpandedEditor()
            }}
            onPointerDownOutside={(event) => event.preventDefault()}
          >
            <header className="px-space-base py-space-sm bg-surface-secondary flex shrink-0 items-center justify-between border-b border-border-subtle">
              <div className="gap-space-sm flex min-w-0 items-center">
                <span className="rounded-radius-md flex size-icon-xl shrink-0 items-center justify-center bg-components-system-accent-soft text-components-system-accent-text">
                  <Code2 className="size-icon-sm" />
                </span>
                <div className="min-w-0">
                  <DialogPrimitive.Title className="truncate text-base font-semibold text-text-primary">
                    {t('flow.codeEditorTitle', 'Code editor')}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="sr-only">
                    {t(
                      'flow.codeEditorDescription',
                      'Edit the current Code node script in a focused workspace.',
                    )}
                  </DialogPrimitive.Description>
                </div>
                <span className="rounded-radius-sm px-space-xs py-space-xs bg-surface-primary border border-border-subtle text-xs font-medium text-text-secondary">
                  {languageLabel}
                </span>
              </div>

              <EditorActionTooltip
                label={t(
                  'flow.codeEditorCollapse',
                  'Return to node configuration',
                )}
              >
                <DialogPrimitive.Close asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t(
                      'flow.codeEditorCollapse',
                      'Return to node configuration',
                    )}
                  >
                    <Minimize2 className="size-icon-sm" />
                  </Button>
                </DialogPrimitive.Close>
              </EditorActionTooltip>
            </header>

            <div className="min-h-0 flex-1">
              <MonacoEditor
                height="100%"
                language={language}
                value={value}
                theme={currentTheme}
                beforeMount={handleBeforeMount}
                onMount={handleExpandedMount}
                onChange={(nextValue) => onChange(nextValue ?? '')}
                loading={loading}
                options={editorOptions}
              />
            </div>

            <footer className="px-space-base py-space-xs bg-surface-secondary flex shrink-0 items-center justify-between border-t border-border-subtle text-xs text-text-secondary">
              <span>
                {t('flow.codeEditorLineCount', 'Lines: {{count}}', {
                  count: lineCount,
                })}
              </span>
              <span className="gap-space-xs hidden items-center sm:flex">
                <kbd className="rounded-radius-sm px-space-xs py-space-xs bg-surface-primary border border-border-default font-mono text-xs text-text-primary">
                  Esc
                </kbd>
                {t('flow.codeEditorEscapeHint', 'Return to node configuration')}
              </span>
            </footer>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </TooltipProvider>
  )
}
