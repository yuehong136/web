import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useGroupRef } from 'react-resizable-panels'
import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { useStudioEditorPreferences } from '@/stores/studio-editor'

export type EditorFocus = 'split' | 'edit' | 'preview'
export function EditorWorkspace({
  editor,
  preview,
  focus,
}: {
  editor: ReactNode
  preview: ReactNode
  focus: EditorFocus
}) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const groupRef = useGroupRef()
  const [wide, setWide] = useState(false)
  const view = useStudioEditorPreferences((state) => state.narrowView)
  const setView = useStudioEditorPreferences((state) => state.setNarrowView)
  const editSize = useStudioEditorPreferences((state) => state.editSize)
  const setEditSize = useStudioEditorPreferences((state) => state.setEditSize)
  const visible = focus !== 'split' ? focus : wide ? 'split' : view
  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) =>
      setWide(entry.contentRect.width >= 880),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  useLayoutEffect(() => {
    groupRef.current?.setLayout(
      visible === 'split'
        ? { 'app-editor': editSize, 'app-preview': 100 - editSize }
        : {
            'app-editor': visible === 'edit' ? 100 : 0,
            'app-preview': visible === 'preview' ? 100 : 0,
          },
    )
  }, [visible, editSize, groupRef])
  return (
    <div ref={containerRef} className="flex h-full min-h-0 min-w-0 flex-col">
      {!wide && focus === 'split' && (
        <fieldset
          className="flex shrink-0 gap-space-xs border-b border-border-default bg-components-studio-surface px-space-base py-space-xs"
          aria-label={t('studio.editor.workspaceViews')}
        >
          {(['edit', 'preview'] as const).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={view === value ? 'secondary' : 'ghost'}
              aria-pressed={view === value}
              onClick={() => setView(value)}
            >
              {t(`studio.editor.${value}`)}
            </Button>
          ))}
        </fieldset>
      )}
      <ResizablePanelGroup
        groupRef={groupRef}
        orientation="horizontal"
        className="min-h-0 flex-1"
        disabled={visible !== 'split'}
        onLayoutChanged={(layout, meta) => {
          if (visible === 'split' && meta.isUserInteraction)
            setEditSize((meta.requestedLayout ?? layout)['app-editor'])
        }}
      >
        <ResizablePanel
          id="app-editor"
          defaultSize="60%"
          minSize={visible === 'split' ? 480 : 0}
          collapsible
          collapsedSize={0}
        >
          <div
            inert={visible === 'preview'}
            aria-hidden={visible === 'preview'}
            className="h-full min-h-0 min-w-0 overflow-hidden"
          >
            {editor}
          </div>
        </ResizablePanel>
        <ResizableHandle
          hidden={visible !== 'split'}
          aria-label={t('studio.editor.resizePanes')}
        />
        <ResizablePanel
          id="app-preview"
          defaultSize="40%"
          minSize={visible === 'split' ? 360 : 0}
          collapsible
          collapsedSize={0}
        >
          <div
            inert={visible === 'edit'}
            aria-hidden={visible === 'edit'}
            className="h-full min-h-0 min-w-0 overflow-hidden"
          >
            {preview}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
