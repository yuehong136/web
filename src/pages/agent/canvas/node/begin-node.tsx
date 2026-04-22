import { memo, useMemo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { Position } from '@xyflow/react'
import {
  AlignLeft,
  Hash,
  ListChecks,
  Paperclip,
  Play,
  ToggleLeft,
  Type,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import type { IBeginNode } from '../../types'
import {
  AgentDialogueMode,
  BeginQueryType,
  NodeHandleId,
} from '../../constant'
import { normalizeBeginInputsForEditor } from '../../form/begin/utils'
import { useBuildWebhookUrl } from '../../hooks/use-build-webhook-url'
import { useIsPipeline } from '../../hooks/use-is-pipeline'
import { LabelCard } from './card'
import { CommonHandle } from './handle'
import { RightHandleStyle } from './handle-styles'
import NodeHeader from './node-header'
import { NodeWrapper } from './node-wrapper'

const MAX_VISIBLE_INPUTS = 3

const BeginInputIconMap = {
  [BeginQueryType.Line]: Type,
  [BeginQueryType.Paragraph]: AlignLeft,
  [BeginQueryType.Options]: ListChecks,
  [BeginQueryType.File]: Paperclip,
  [BeginQueryType.Integer]: Hash,
  [BeginQueryType.Boolean]: ToggleLeft,
} as const

function getBeginModeLabel(t: ReturnType<typeof useTranslation>['t'], mode?: string) {
  switch (mode) {
    case AgentDialogueMode.Task:
      return t('flow.task', 'Task')
    case AgentDialogueMode.Webhook:
      return t('flow.webhook.name', 'Webhook')
    case AgentDialogueMode.Conversational:
    default:
      return t('flow.conversational', 'Conversational')
  }
}

function getBeginModeVariant(mode?: string) {
  switch (mode) {
    case AgentDialogueMode.Task:
      return 'orange' as const
    case AgentDialogueMode.Webhook:
      return 'purple' as const
    case AgentDialogueMode.Conversational:
    default:
      return 'blue' as const
  }
}

function getBeginInputTypeLabel(
  t: ReturnType<typeof useTranslation>['t'],
  type?: string,
) {
  switch (type) {
    case BeginQueryType.Line:
      return t('flow.line', 'Line')
    case BeginQueryType.Paragraph:
      return t('flow.paragraph', 'Paragraph')
    case BeginQueryType.Options:
      return t('flow.options', 'Options')
    case BeginQueryType.File:
      return t('flow.file', 'File')
    case BeginQueryType.Integer:
      return t('flow.integer', 'Integer')
    case BeginQueryType.Boolean:
      return t('flow.boolean', 'Boolean')
    default:
      return type || t('common.unassigned', 'Unassigned')
  }
}

function InnerBeginNode({ id, data, isConnectable, selected }: NodeProps<IBeginNode>) {
  const { t } = useTranslation()
  const isPipeline = useIsPipeline()
  const webhookUrl = useBuildWebhookUrl()
  const mode = data.form?.mode || AgentDialogueMode.Conversational
  const isWebhookMode = mode === AgentDialogueMode.Webhook
  const inputs = useMemo(
    () => normalizeBeginInputsForEditor(data.form?.inputs),
    [data.form?.inputs],
  )
  const visibleInputs = inputs.slice(0, MAX_VISIBLE_INPUTS)
  const remainingInputCount = Math.max(inputs.length - visibleInputs.length, 0)

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
        name={data.name}
        label={data.label}
        icon={
          <Play
            className="size-4"
            style={{ color: 'var(--color-components-canvas-icon-start)' }}
          />
        }
      />
      <section className="flex flex-col gap-space-sm">
        {!isPipeline && (
          <div>
            <Badge variant={getBeginModeVariant(mode)}>
              {getBeginModeLabel(t, mode)}
            </Badge>
          </div>
        )}

        {isWebhookMode ? (
          <LabelCard className="flex items-center gap-space-sm">
            <span className="shrink-0 font-medium text-text-primary">URL</span>
            <span className="min-w-0 flex-1 truncate">{webhookUrl}</span>
          </LabelCard>
        ) : visibleInputs.length > 0 ? (
          <>
            {visibleInputs.map((input, index) => {
              const Icon = BeginInputIconMap[
                input.type as keyof typeof BeginInputIconMap
              ]

              return (
                <LabelCard
                  key={`${input.key || input.name || 'input'}-${index}`}
                  className="flex items-center gap-space-sm"
                >
                  {Icon ? (
                    <Icon className="size-3.5 shrink-0 text-text-secondary" />
                  ) : (
                    <Type className="size-3.5 shrink-0 text-text-secondary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-text-primary">
                      {input.name || input.key || t('common.unassigned', 'Unassigned')}
                    </div>
                    <div className="truncate text-text-tertiary">
                      {[
                        input.key && input.key !== input.name ? input.key : null,
                        input.optional
                          ? t('flow.optional', 'Optional')
                          : t('common.required', 'Required'),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  <span className="shrink-0 text-text-tertiary">
                    {getBeginInputTypeLabel(t, input.type)}
                  </span>
                </LabelCard>
              )
            })}
            {remainingInputCount > 0 && (
              <div className="text-xs text-text-tertiary">
                +{remainingInputCount} {t('flow.input', 'Input')}
              </div>
            )}
          </>
        ) : (
          <LabelCard>
            {t('flow.noInputs', 'No inputs configured')}
          </LabelCard>
        )}
      </section>
    </NodeWrapper>
  )
}

export const BeginNode = memo(InnerBeginNode)
