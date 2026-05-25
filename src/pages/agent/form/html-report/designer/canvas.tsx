/** Designer 中栏:顶部「报告设置」入口 + 小节列表(可整体排序),空态提示从 Palette 添加小节。 */
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { FileText, LayoutGrid } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { CanvasSection } from './canvas-section'
import type { DraftAction, Selection } from './use-skeleton-draft'
import type { SkeletonSection } from '../types'

interface CanvasProps {
  sections: SkeletonSection[]
  selection: Selection
  dispatch: React.Dispatch<DraftAction>
}

export function Canvas({ sections, selection, dispatch }: CanvasProps) {
  const { t } = useTranslation()
  // 报告级设置常驻入口:加了小节后选中会自动落到小节,这里保证「报告设置」始终可达
  const reportSelected = selection.kind === 'theme' || selection.kind === 'none'

  return (
    <div className="space-y-space-sm p-space-base h-full overflow-auto">
      <button
        type="button"
        onClick={() =>
          dispatch({ type: 'select', selection: { kind: 'theme' } })
        }
        className={cn(
          'gap-space-xs rounded-radius-lg px-space-sm py-space-sm flex w-full items-center border text-left',
          reportSelected
            ? 'border-border-focus bg-surface-secondary'
            : 'border-border-default hover:bg-state-hover',
        )}
      >
        <FileText className="size-icon-sm text-text-caption" />
        <span className="text-xs font-medium text-text-secondary">
          {t('flow.htmlReportReportSettings', 'Report settings')}
        </span>
      </button>

      {sections.length === 0 ? (
        <div className="gap-space-sm p-space-lg flex flex-col items-center justify-center text-center">
          <div className="rounded-radius-lg bg-surface-secondary p-space-sm text-text-caption">
            <LayoutGrid className="size-icon-lg" />
          </div>
          <p className="text-sm text-text-secondary">
            {t(
              'flow.htmlReportCanvasEmpty',
              'Add a section from the layout group on the left',
            )}
          </p>
        </div>
      ) : (
        <SortableContext
          items={sections.map((s) => `section:${s.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {sections.map((section, index) => (
            <CanvasSection
              key={section.id}
              section={section}
              index={index}
              sectionSelected={
                selection.kind === 'section' &&
                selection.sectionId === section.id
              }
              selectedBlockId={
                selection.kind === 'block' && selection.sectionId === section.id
                  ? selection.blockId
                  : undefined
              }
              onSelectSection={() =>
                dispatch({
                  type: 'select',
                  selection: { kind: 'section', sectionId: section.id },
                })
              }
              onSelectBlock={(blockId) =>
                dispatch({
                  type: 'select',
                  selection: { kind: 'block', sectionId: section.id, blockId },
                })
              }
              onRemoveSection={() =>
                dispatch({ type: 'removeSection', sectionId: section.id })
              }
              onRemoveBlock={(blockId) =>
                dispatch({
                  type: 'removeBlock',
                  sectionId: section.id,
                  blockId,
                })
              }
              onSetBlockRole={(blockId, role) =>
                dispatch({
                  type: 'setBlockRole',
                  sectionId: section.id,
                  blockId,
                  role,
                })
              }
            />
          ))}
        </SortableContext>
      )}
    </div>
  )
}
