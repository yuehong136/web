import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { BeginInputEditorItem } from './utils'

type QueryTableProps = {
  data?: BeginInputEditorItem[]
  deleteRecord(index: number): void
  moveRecord(fromIndex: number, toIndex: number): void
  showModal(index?: number, record?: BeginInputEditorItem): void
}

function EllipsisCell({ value }: { value?: string }) {
  if (!value) {
    return <span className="text-text-tertiary">-</span>
  }

  return (
    <Tooltip content={value}>
      <span className="block max-w-48 truncate">{value}</span>
    </Tooltip>
  )
}

function createInputRowId(record: BeginInputEditorItem, index: number) {
  const key = record.key?.trim()
  return key
    ? `begin-input-${key}`
    : `begin-input-${record.name || 'row'}-${index}`
}

type SortableInputRowProps = {
  id: string
  record: BeginInputEditorItem
  index: number
  deleteRecord(index: number): void
  showModal(index?: number, record?: BeginInputEditorItem): void
}

function SortableInputRow({
  id,
  record,
  index,
  deleteRecord,
  showModal,
}: SortableInputRowProps) {
  const { t } = useTranslation()
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  const dragLabel = t('flow.dragToReorderInput', 'Drag to reorder input')

  return (
    <TableRow
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        isDragging &&
          'bg-surface-primary shadow-elevation-low relative z-10 opacity-80',
      )}
    >
      <TableCell className="px-space-xs py-space-sm w-10 align-middle">
        <Button
          {...attributes}
          {...listeners}
          ref={setActivatorNodeRef}
          type="button"
          variant="ghost"
          size="icon-sm"
          className="cursor-grab touch-none text-text-tertiary active:cursor-grabbing"
          aria-label={dragLabel}
          title={dragLabel}
        >
          <GripVertical aria-hidden="true" />
        </Button>
      </TableCell>
      <TableCell>
        <EllipsisCell value={record.key} />
      </TableCell>
      <TableCell>
        <EllipsisCell value={record.name} />
      </TableCell>
      <TableCell>
        {t(`flow.${record.type?.toLowerCase()}`, record.type)}
      </TableCell>
      <TableCell>
        {record.optional ? t('common.yes', 'Yes') : t('common.no', 'No')}
      </TableCell>
      <TableCell>
        <div className="gap-space-xs flex items-center justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => showModal(index, record)}
          >
            <Pencil />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => deleteRecord(index)}
          >
            <Trash2 />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function QueryTable({
  data = [],
  deleteRecord,
  moveRecord,
  showModal,
}: QueryTableProps) {
  const { t } = useTranslation()
  const dragLabel = t('flow.dragToReorderInput', 'Drag to reorder input')
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )
  const rowIds = useMemo(
    () => data.map((record, index) => createInputRowId(record, index)),
    [data],
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    const fromIndex = rowIds.indexOf(String(active.id))
    const toIndex = rowIds.indexOf(String(over.id))
    moveRecord(fromIndex, toIndex)
  }

  return (
    <div className="rounded-radius-lg bg-surface-secondary border border-border-default">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" aria-label={dragLabel}>
                <span className="sr-only">{dragLabel}</span>
              </TableHead>
              <TableHead>{t('flow.key', 'Key')}</TableHead>
              <TableHead>{t('flow.name', 'Name')}</TableHead>
              <TableHead>{t('flow.type', 'Type')}</TableHead>
              <TableHead>{t('flow.optional', 'Optional')}</TableHead>
              <TableHead className="text-right">
                {t('common.action', 'Action')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              <SortableContext
                items={rowIds}
                strategy={verticalListSortingStrategy}
              >
                {data.map((record, index) => (
                  <SortableInputRow
                    key={rowIds[index]}
                    id={rowIds[index] || createInputRowId(record, index)}
                    record={record}
                    index={index}
                    showModal={showModal}
                    deleteRecord={deleteRecord}
                  />
                ))}
              </SortableContext>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-space-lg text-center text-sm text-text-secondary"
                >
                  {t('common.noData', 'No data')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DndContext>
    </div>
  )
}
