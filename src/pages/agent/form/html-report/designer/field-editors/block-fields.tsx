/**
 * 非图表 Block 的字段编辑区:标量/结构叶子 + 列表型叶子(增删)+ 纯结构列头数组 +
 * 整段数据指令(rows/criteria)。chart 走 chart-shape-fields.tsx。
 */
import { Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { getFieldValue } from '../../skeleton-utils'
import type { SkeletonBlock } from '../../types'
import type { DraftAction } from '../use-skeleton-draft'
import { FieldDirectiveRow } from './field-directive-row'
import {
  BLOCK_BULK,
  BLOCK_FIELDS,
  BLOCK_LIST,
  BLOCK_STATIC_ARRAY,
  type FieldDescriptor,
  type ListGroup,
  type StaticArrayGroup,
} from './field-map'
import {
  InspectorField,
  StructureSelect,
  ValueControl,
} from './field-primitives'

interface BlockFieldsProps {
  block: SkeletonBlock
  sectionId: string
  dispatch: React.Dispatch<DraftAction>
}

export function BlockFields({ block, sectionId, dispatch }: BlockFieldsProps) {
  const { t } = useTranslation()
  const list = BLOCK_LIST[block.type]
  const staticArray = BLOCK_STATIC_ARRAY[block.type]
  const bulk = BLOCK_BULK[block.type]

  return (
    <div className="space-y-space-md">
      {BLOCK_FIELDS[block.type].map((field) => (
        <FieldRow
          key={field.path}
          field={field}
          block={block}
          sectionId={sectionId}
          dispatch={dispatch}
        />
      ))}
      {staticArray && (
        <StaticArrayEditor
          group={staticArray}
          block={block}
          sectionId={sectionId}
          dispatch={dispatch}
        />
      )}
      {list && (
        <ListEditor
          group={list}
          block={block}
          sectionId={sectionId}
          dispatch={dispatch}
        />
      )}
      {bulk && (
        <FieldDirectiveRow
          block={block}
          sectionId={sectionId}
          path={bulk.path}
          label={t(bulk.labelKey, bulk.fallback)}
          modes={['llm']}
          dispatch={dispatch}
        />
      )}
    </div>
  )
}

function FieldRow({
  field,
  block,
  sectionId,
  dispatch,
}: {
  field: FieldDescriptor
  block: SkeletonBlock
  sectionId: string
  dispatch: React.Dispatch<DraftAction>
}) {
  const { t } = useTranslation()
  if (field.kind === 'structure') {
    const current =
      getFieldValue(block.fields ?? {}, field.path) ?? field.options[0]?.value
    return (
      <InspectorField label={t(field.labelKey, field.fallback)}>
        <StructureSelect
          value={String(current)}
          options={field.options}
          onChange={(raw) =>
            dispatch({
              type: 'setFieldValue',
              sectionId,
              blockId: block.id,
              path: field.path,
              value:
                field.valueType === 'number'
                  ? Number(raw)
                  : field.valueType === 'boolean'
                    ? raw === 'true'
                    : raw,
            })
          }
        />
      </InspectorField>
    )
  }
  return (
    <FieldDirectiveRow
      block={block}
      sectionId={sectionId}
      path={field.path}
      label={t(field.labelKey, field.fallback)}
      control={field.control}
      dispatch={dispatch}
    />
  )
}

function ListEditor({
  group,
  block,
  sectionId,
  dispatch,
}: {
  group: ListGroup
  block: SkeletonBlock
  sectionId: string
  dispatch: React.Dispatch<DraftAction>
}) {
  const { t } = useTranslation()
  const items = (getFieldValue(block.fields ?? {}, group.arrayPath) ??
    []) as unknown[]

  const setItems = (next: unknown[]) =>
    dispatch({
      type: 'setFieldValue',
      sectionId,
      blockId: block.id,
      path: group.arrayPath,
      value: next,
    })

  return (
    <div className="space-y-space-sm">
      {items.map((_, index) => (
        <div
          key={index}
          className="space-y-space-sm rounded-radius-md bg-surface-secondary p-space-sm border border-border-subtle"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">
              {t(group.itemLabelKey, group.itemFallback)} {index + 1}
            </span>
            <button
              type="button"
              onClick={() => setItems(items.filter((_, i) => i !== index))}
              className="text-text-caption hover:text-status-error"
              aria-label={t('flow.htmlReportRemove', 'Remove')}
            >
              <X className="size-icon-sm" />
            </button>
          </div>
          {group.itemFields.map((itemField) => {
            const path = itemField.key
              ? `${group.arrayPath}[${index}].${itemField.key}`
              : `${group.arrayPath}[${index}]`
            if (itemField.structure) {
              const current =
                getFieldValue(block.fields ?? {}, path) ??
                itemField.structure.options[0]?.value
              return (
                <InspectorField
                  key={path}
                  label={t(itemField.labelKey, itemField.fallback)}
                >
                  <StructureSelect
                    value={String(current)}
                    options={itemField.structure.options}
                    onChange={(raw) =>
                      dispatch({
                        type: 'setFieldValue',
                        sectionId,
                        blockId: block.id,
                        path,
                        value: raw,
                      })
                    }
                  />
                </InspectorField>
              )
            }
            return (
              <FieldDirectiveRow
                key={path}
                block={block}
                sectionId={sectionId}
                path={path}
                label={t(itemField.labelKey, itemField.fallback)}
                control={itemField.control}
                dispatch={dispatch}
              />
            )
          })}
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        leftIcon={<Plus className="size-icon-sm" />}
        onClick={() => setItems([...items, group.newItem()])}
      >
        {t(group.addLabelKey, group.addFallback)}
      </Button>
    </div>
  )
}

function StaticArrayEditor({
  group,
  block,
  sectionId,
  dispatch,
}: {
  group: StaticArrayGroup
  block: SkeletonBlock
  sectionId: string
  dispatch: React.Dispatch<DraftAction>
}) {
  const { t } = useTranslation()
  const items = (getFieldValue(block.fields ?? {}, group.arrayPath) ??
    []) as string[]

  const setItems = (next: string[]) =>
    dispatch({
      type: 'setFieldValue',
      sectionId,
      blockId: block.id,
      path: group.arrayPath,
      value: next,
    })

  return (
    <InspectorField label={t(group.labelKey, group.fallback)}>
      <div className="space-y-space-xs">
        {items.map((value, index) => (
          <div key={index} className="gap-space-xs flex items-center">
            <ValueControl
              control="text"
              value={value ?? ''}
              onChange={(next) =>
                setItems(items.map((v, i) => (i === index ? next : v)))
              }
            />
            <button
              type="button"
              onClick={() => setItems(items.filter((_, i) => i !== index))}
              className="text-text-caption hover:text-status-error"
              aria-label={t('flow.htmlReportRemove', 'Remove')}
            >
              <X className="size-icon-sm" />
            </button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          leftIcon={<Plus className="size-icon-sm" />}
          onClick={() => setItems([...items, ''])}
        >
          {t(group.addLabelKey, group.addFallback)}
        </Button>
      </div>
    </InspectorField>
  )
}
