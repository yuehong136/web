/**
 * 全屏报告骨架 Designer。三栏:Palette(左) / Canvas(中) / Inspector+Preview(右 Tabs)。
 * 草稿在本组件内用 useReducer 维护,保存时一次性回写给调用方(form/index.tsx)。
 */
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  Maximize2,
  Minimize2,
  Redo2,
  Save,
  Sparkles,
  Undo2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { AiSkeletonDialog } from './ai-skeleton/ai-skeleton-dialog'
import { createDefaultBlock } from './block-defaults'
import { Canvas } from './canvas'
import { resolveDragEnd } from './dnd'
import { Inspector } from './inspector'
import { Palette } from './palette'
import { Preview } from './preview'
import { useSkeletonDraft } from './use-skeleton-draft'
import { makeId } from '../skeleton-utils'
import type { BlockKind, ChartType, LayoutType, SkeletonSchema } from '../types'

interface DesignerProps {
  open: boolean
  initialSkeleton: SkeletonSchema
  onSave: (skeleton: SkeletonSchema) => void
  onClose: () => void
}

export function Designer({
  open,
  initialSkeleton,
  onSave,
  onClose,
}: DesignerProps) {
  const { t } = useTranslation()
  const { state, dispatch, canUndo, canRedo } =
    useSkeletonDraft(initialSkeleton)
  const [previewFull, setPreviewFull] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)

  // 仅在「打开」的上升沿用最新骨架重新播种草稿,避免开着时父组件重渲染冲掉编辑
  const wasOpen = useRef(false)
  useEffect(() => {
    if (open && !wasOpen.current)
      dispatch({ type: 'reset', skeleton: initialSkeleton })
    wasOpen.current = open
  }, [open, initialSkeleton, dispatch])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const action = resolveDragEnd(event, state.present)
    if (action) dispatch(action)
  }

  const handleAddBlock = (blockType: BlockKind, chartType?: ChartType) => {
    const sections = state.present.sections
    const targetId =
      state.selection.kind === 'section' || state.selection.kind === 'block'
        ? state.selection.sectionId
        : sections[sections.length - 1]?.id

    if (!targetId) {
      const id = makeId('sec')
      dispatch({ type: 'addSection', layout: 'full', id })
      dispatch({
        type: 'addBlock',
        sectionId: id,
        block: createDefaultBlock(blockType, undefined, chartType),
      })
      return
    }
    dispatch({
      type: 'addBlock',
      sectionId: targetId,
      block: createDefaultBlock(blockType, undefined, chartType),
    })
  }

  const handleAddSection = (layout: LayoutType) =>
    dispatch({ type: 'addSection', layout })

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        showCloseButton={false}
        className="inset-0 flex h-full w-full max-w-none flex-col gap-0 p-0 sm:max-w-none"
      >
        <SheetTitle className="sr-only">
          {t('flow.htmlReportDesignerTitle', 'Report designer')}
        </SheetTitle>
        <SheetDescription className="sr-only">
          {t(
            'flow.htmlReportDesignerDesc',
            'Lay out report sections, blocks and charts',
          )}
        </SheetDescription>

        {/* 工具栏 */}
        <header className="gap-space-sm px-space-base py-space-sm flex items-center border-b border-border-default">
          <span className="text-sm font-semibold text-text-primary">
            {t('flow.htmlReportDesignerTitle', 'Report designer')}
          </span>
          <div className="gap-space-xs ml-auto flex items-center">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!canUndo}
              onClick={() => dispatch({ type: 'undo' })}
              aria-label={t('flow.htmlReportUndo', 'Undo')}
            >
              <Undo2 className="size-icon-sm" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!canRedo}
              onClick={() => dispatch({ type: 'redo' })}
              aria-label={t('flow.htmlReportRedo', 'Redo')}
            >
              <Redo2 className="size-icon-sm" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Sparkles className="size-icon-sm" />}
              onClick={() => setAiOpen(true)}
            >
              {t('flow.htmlReportAiGenerate', 'AI generate')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={state.present.sections.length === 0}
              leftIcon={<Maximize2 className="size-icon-sm" />}
              onClick={() => setPreviewFull(true)}
            >
              {t('flow.htmlReportPreviewFull', 'Full preview')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled
              title={t('flow.htmlReportTryRunSoon', 'Trial run is coming soon')}
            >
              {t('flow.htmlReportTryRun', 'Trial run')}
            </Button>
            <Button
              variant="default"
              size="sm"
              leftIcon={<Save className="size-icon-sm" />}
              onClick={() => onSave(state.present)}
            >
              {t('flow.htmlReportSave', 'Save')}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label={t('common.close', 'Close')}
            >
              <X className="size-icon-sm" />
            </Button>
          </div>
        </header>

        {/* 三栏 + 全屏预览覆盖层 */}
        <div className="relative flex min-h-0 flex-1 flex-col">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="flex min-h-0 flex-1">
              <aside className="w-48 shrink-0 border-r border-border-default">
                <Palette
                  onAddBlock={handleAddBlock}
                  onAddSection={handleAddSection}
                />
              </aside>
              <main className="bg-surface-secondary min-w-0 flex-1">
                <Canvas
                  sections={state.present.sections}
                  selection={state.selection}
                  dispatch={dispatch}
                />
              </main>
              <aside className="flex w-96 shrink-0 flex-col border-l border-border-default">
                <div className="px-space-base py-space-sm border-b border-border-default">
                  <span className="text-sm font-medium text-text-primary">
                    {t('flow.htmlReportTabInspector', 'Properties')}
                  </span>
                </div>
                <div className="min-h-0 flex-1 overflow-auto">
                  <Inspector state={state} dispatch={dispatch} />
                </div>
              </aside>
            </div>
          </DndContext>

          {previewFull && (
            <div className="bg-surface-primary absolute inset-0 z-10 flex flex-col">
              <div className="gap-space-sm px-space-base py-space-sm flex items-center border-b border-border-default">
                <span className="text-sm font-medium text-text-primary">
                  {t('flow.htmlReportPreview', 'Preview')}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="ml-auto"
                  onClick={() => setPreviewFull(false)}
                  aria-label={t('flow.htmlReportPreviewExit', 'Exit preview')}
                >
                  <Minimize2 className="size-icon-sm" />
                </Button>
              </div>
              <div className="min-h-0 flex-1">
                <Preview skeleton={state.present} variant="full" />
              </div>
            </div>
          )}
        </div>

        <AiSkeletonDialog
          open={aiOpen}
          hasContent={state.present.sections.length > 0}
          onGenerated={(skeleton) => {
            dispatch({ type: 'reset', skeleton })
            setAiOpen(false)
          }}
          onClose={() => setAiOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
