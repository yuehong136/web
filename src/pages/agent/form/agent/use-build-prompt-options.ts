import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetchPrompt } from '@/hooks/use-agent-request'
import type { VariableOptionGroup } from '@/components/prompt-editor'
import type { Edge } from '@xyflow/react'
import { hasSubAgentOrTool } from '../../utils'

export const PromptIdentity = 'RAGFlow-Prompt'

function wrapPromptWithTag(text: string, tag: string) {
  const capitalizedTag = tag.toUpperCase()
  return `<${capitalizedTag}>
  ${text}
</${capitalizedTag}>`
}

export function useBuildPromptExtraPromptOptions(
  edges: Edge[],
  nodeId?: string,
) {
  const { data } = useFetchPrompt()
  const { t } = useTranslation()
  const hasLinkedToolOrSubAgent = hasSubAgentOrTool(edges, nodeId)

  const extraOptions = useMemo<VariableOptionGroup[]>(() => {
    const options = Object.entries(data || {})
      .map(([key, value]) => ({
        label: key,
        value: wrapPromptWithTag(value, key),
        parentLabel: PromptIdentity,
        insertMode: 'text' as const,
      }))
      .filter((option) => {
        if (hasLinkedToolOrSubAgent) {
          return true
        }

        return option.label === 'citation_guidelines'
      })

    if (options.length === 0) {
      return []
    }

    return [
      {
        label: PromptIdentity,
        title: t('flow.frameworkPrompts', 'Framework Prompts'),
        options,
      },
    ]
  }, [data, hasLinkedToolOrSubAgent, t])

  return { extraOptions }
}
