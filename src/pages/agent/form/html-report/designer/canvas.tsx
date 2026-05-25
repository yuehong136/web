/** Designer 中栏:小节列表(可整体排序),空态提示从 Palette 添加小节。 */
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { LayoutGrid } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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

  if (sections.length === 0) {
    return (
      <div className="gap-space-sm p-space-lg flex h-full flex-col items-center justify-center text-center">
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
    )
  }

  return (
    <div className="space-y-space-sm p-space-base h-full overflow-auto">
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
              selection.kind === 'section' && selection.sectionId === section.id
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
            onSetLayout={(layout) =>
              dispatch({
                type: 'setSectionLayout',
                sectionId: section.id,
                layout,
              })
            }
            onRemoveSection={() =>
              dispatch({ type: 'removeSection', sectionId: section.id })
            }
            onRemoveBlock={(blockId) =>
              dispatch({ type: 'removeBlock', sectionId: section.id, blockId })
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
    </div>
  )
}
