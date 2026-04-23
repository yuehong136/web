import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import { Layers } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NodeHandleId } from '../../constant'
import { LabelCard } from './card'
import { CommonHandle } from './handle'
import { LeftHandleStyle } from './handle-icon'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'
import { ToolBar } from './toolbar'

const SearchMethodLabelMap: Record<string, string> = {
  embedding: 'Embedding',
  full_text: 'Full Text',
}

function getSearchMethodLabel(value: string) {
  return (
    SearchMethodLabelMap[value] ||
    value
      .split('_')
      .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
      .join(' ')
  )
}

function InnerTokenizerNode({
  id,
  data,
  isConnectable,
  selected,
}: NodeProps) {
  const { t } = useTranslation()
  const searchMethods =
    ((data.form ?? {}) as { search_method?: string[] }).search_method ?? []

  return (
    <ToolBar
      selected={selected}
      id={id}
      label={data.label as string}
      showRun={false}
      showCopy={false}
    >
      <NodeWrapper selected={selected} id={id}>
        <CommonHandle
          id={NodeHandleId.End}
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          style={LeftHandleStyle}
          nodeId={id}
        />
        <NodeHeader
          id={id}
          name={data.name as string}
          label={data.label as string}
          icon={
            <Layers
              className="size-4"
              style={{ color: 'var(--color-components-canvas-icon-tokenizer)' }}
            />
          }
        />
        <LabelCard className="flex flex-col gap-space-xs text-text-primary">
          <span className="text-text-secondary">
            {t('flow.searchMethod', 'Search Method')}
          </span>
          {searchMethods.length > 0 ? (
            <ul className="space-y-space-xs">
              {searchMethods.map((item) => (
                <li key={item}>{getSearchMethodLabel(item)}</li>
              ))}
            </ul>
          ) : (
            <span>{t('flow.noSearchMethod', 'No search methods configured')}</span>
          )}
        </LabelCard>
      </NodeWrapper>
    </ToolBar>
  )
}

export const TokenizerNode = memo(InnerTokenizerNode)
