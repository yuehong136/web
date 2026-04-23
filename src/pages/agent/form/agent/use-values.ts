import get from 'lodash/get.js'
import isEmpty from 'lodash/isEmpty.js'
import omit from 'lodash/omit.js'
import { useMemo } from 'react'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import {
  findFirstEnabledModelByType,
  qualifyLLMValueWithProvider,
} from '@/stores/model'
import { useTranslation } from 'react-i18next'
import { AgentStructuredOutputField, initialAgentValues } from '../../constant'
import type { RAGFlowNodeType } from '../../types'

function omitNonFormFields(values: Record<string, unknown>) {
  return omit(values, ['mcp', 'tools', 'outputs']) as Record<string, unknown>
}

export function useValues(node?: RAGFlowNodeType) {
  const { t } = useTranslation()
  const { myLLMs } = useFetchMyLLMs()

  return useMemo(() => {
    const formData = (node?.data?.form || {}) as Record<string, unknown>
    const defaultValues = {
      ...omitNonFormFields(
        initialAgentValues as unknown as Record<string, unknown>,
      ),
      llm_id:
        findFirstEnabledModelByType(myLLMs, 'chat', {
          valueMode: 'nameWithProvider',
        }) ||
        String(get(initialAgentValues, 'llm_id', '')),
      sys_prompt: t(
        'flow.sysPromptDefaultValue',
        String(get(initialAgentValues, 'sys_prompt', '')),
      ),
      prompts: get(initialAgentValues, 'prompts.0.content', ''),
      showStructuredOutput: false,
    }

    if (isEmpty(formData)) {
      return defaultValues
    }

    return {
      ...defaultValues,
      ...omitNonFormFields(formData),
      llm_id:
        qualifyLLMValueWithProvider(
          myLLMs,
          typeof formData.llm_id === 'string' ? formData.llm_id : null,
          true,
        ) || defaultValues.llm_id,
      prompts:
        get(formData, 'prompts.0.content', '') ||
        (typeof formData.user_prompt === 'string' ? formData.user_prompt : ''),
      showStructuredOutput: Boolean(
        get(formData, `outputs.${AgentStructuredOutputField}`),
      ),
    }
  }, [myLLMs, node?.data?.form, t])
}
