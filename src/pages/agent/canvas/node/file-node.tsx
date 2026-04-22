import { memo, useMemo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import {
  AlignLeft,
  FileUp,
  Hash,
  ListChecks,
  Paperclip,
  ToggleLeft,
  Type,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { BeginQueryType, NodeHandleId } from '../../constant'
import { normalizeBeginInputsForEditor } from '../../form/begin/utils'
import { LabelCard } from './card'
import { CommonHandle } from './handle'
import { RightHandleStyle } from './handle-styles'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { SummaryList } from './summary-list'

const FileInputIconMap = {
  [BeginQueryType.Line]: Type,
  [BeginQueryType.Paragraph]: AlignLeft,
  [BeginQueryType.Options]: ListChecks,
  [BeginQueryType.File]: Paperclip,
  [BeginQueryType.Integer]: Hash,
  [BeginQueryType.Boolean]: ToggleLeft,
} as const

function InnerFileNode({ id, data, isConnectable, selected }: NodeProps) {
  const { t } = useTranslation()
  const form = (data.form ?? {}) as {
    inputs?: unknown
  }
  const inputs = useMemo(
    () => normalizeBeginInputsForEditor(form.inputs),
    [form.inputs],
  )

  return (
    <NodeWrapper selected={selected} id={id}>
      <CommonHandle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        id={NodeHandleId.Start}
        style={RightHandleStyle}
        isConnectableEnd={false}
        nodeId={id}
      />
      <NodeHeader
        id={id}
        name={data.name as string}
        label={data.label as string}
        icon={<FileUp className="w-4 h-4" style={{ color: 'var(--color-components-canvas-icon-file)' }} />}
      />
      <SummaryList
        items={inputs}
        empty={
          <LabelCard>{t('flow.noInputs', 'No inputs configured')}</LabelCard>
        }
        renderItem={(input, index, { withDivider }) => {
          const Icon =
            FileInputIconMap[
              input.type as keyof typeof FileInputIconMap
            ] || Type

          return (
            <div
              key={`${input.key || input.name || 'input'}-${index}`}
              className={cn(
                'flex items-center gap-space-sm px-space-sm py-space-sm',
                withDivider && 'border-t border-border-subtle',
              )}
            >
              <Icon className="size-3.5 shrink-0 text-text-secondary" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-text-primary">
                  {input.name || input.key || t('common.unassigned', 'Unassigned')}
                </div>
                {input.key && input.key !== input.name ? (
                  <div className="truncate text-text-secondary">{input.key}</div>
                ) : null}
              </div>
              <span className="shrink-0 text-text-tertiary">
                {input.optional
                  ? t('flow.optional', 'Optional')
                  : t('common.required', 'Required')}
              </span>
            </div>
          )
        }}
      />
    </NodeWrapper>
  )
}

export const FileNode = memo(InnerFileNode)
