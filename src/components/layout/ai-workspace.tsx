import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { getReturnFocusTargets } from '@/components/chat/use-return-focus'

const WIDTH_PREFERENCE = 'ai-workspace-panel-width'
const MIN_DOCK_CONTAINER_WIDTH = 1100

function initialWidth() {
  try {
    const saved = Number(localStorage.getItem(WIDTH_PREFERENCE))
    return saved >= 25 && saved <= 45 ? saved : 34
  } catch {
    return 34
  }
}

export interface AiWorkspaceProps {
  children: ReactNode
  detail: ReactNode
  detailTitle: string
  detailDescription?: string
  resizeLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Changing identity/thread invalidates the old resource selection. */
  scopeKey: string
  /** Explicit resource actions may replace the originating main-area control. */
  returnFocusTargets?: readonly HTMLElement[]
}

/** The primary panel stays mounted across resource, locale and width changes. */
export function AiWorkspace({
  children,
  detail,
  detailTitle,
  detailDescription,
  resizeLabel,
  open,
  onOpenChange,
  scopeKey,
  returnFocusTargets,
}: AiWorkspaceProps) {
  const container = useRef<HTMLDivElement>(null)
  const [wide, setWide] = useState(false)
  const [width, setWidth] = useState(initialWidth)
  const targets = useRef<HTMLElement[]>([])
  const wasOpen = useRef(false)
  const previousScope = useRef(scopeKey)

  useEffect(() => {
    const element = container.current
    if (!element) return
    const measure = () => {
      // Measure the actual space left after navigation; browser zoom reduces
      // this CSS width. Larger text also needs a larger minimum reading area.
      const scale = Math.max(
        1,
        (parseFloat(getComputedStyle(element).fontSize) || 16) / 16,
      )
      setWide(
        element.getBoundingClientRect().width >=
          MIN_DOCK_CONTAINER_WIDTH * scale,
      )
    }
    measure()
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(element)
    const appearanceObserver = new MutationObserver(measure)
    appearanceObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-text-scale'],
    })
    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      appearanceObserver.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => {
    if (previousScope.current !== scopeKey) {
      previousScope.current = scopeKey
      targets.current = []
      if (open) onOpenChange(false)
    }
  }, [scopeKey, open, onOpenChange])

  useEffect(() => {
    if (open && (!wasOpen.current || returnFocusTargets))
      targets.current = [...(returnFocusTargets ?? getReturnFocusTargets())]
    if (!open && wasOpen.current) {
      for (const target of targets.current) {
        if (!target.isConnected) continue
        target.focus({ preventScroll: true })
        if (document.activeElement === target) break
      }
      targets.current = []
    }
    wasOpen.current = open
  }, [open, returnFocusTargets])

  return (
    <div
      ref={container}
      className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden"
      data-ai-workspace
      data-workspace-mode={wide ? 'dock' : 'sheet'}
    >
      <Group orientation="horizontal" className="min-h-0 min-w-0 flex-1">
        <Panel
          id="ai-workspace-main"
          minSize="55%"
          defaultSize={`${100 - width}%`}
        >
          <div
            className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
            data-workspace-main
          >
            {children}
          </div>
        </Panel>
        {wide && open && (
          <>
            <Separator
              aria-label={resizeLabel}
              className="w-px bg-border-subtle hover:bg-state-focus focus-visible:bg-state-focus focus-visible:outline-hidden"
            />
            <Panel
              id="ai-workspace-detail"
              minSize="25%"
              maxSize="45%"
              defaultSize={`${width}%`}
              onResize={({ asPercentage }) => {
                if (asPercentage >= 25 && asPercentage <= 45) {
                  setWidth(asPercentage)
                  try {
                    localStorage.setItem(WIDTH_PREFERENCE, String(asPercentage))
                  } catch {
                    /* Preferences are optional in restricted storage contexts. */
                  }
                }
              }}
            >
              <div
                className="h-full min-h-0 min-w-0 overflow-hidden"
                data-workspace-detail
              >
                {detail}
              </div>
            </Panel>
          </>
        )}
      </Group>
      <Sheet
        open={!wide && open}
        onOpenChange={(next) => {
          if (!next && !wide) onOpenChange(false)
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="h-full w-full overflow-hidden p-0 sm:max-w-xl"
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <SheetTitle className="sr-only">{detailTitle}</SheetTitle>
          <SheetDescription className="sr-only">
            {detailDescription ?? detailTitle}
          </SheetDescription>
          {detail}
        </SheetContent>
      </Sheet>
    </div>
  )
}
