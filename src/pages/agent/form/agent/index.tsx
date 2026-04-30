import { zodResolver } from '@hookform/resolvers/zod'
import get from 'lodash/get.js'
import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import { resolveLLMValue } from '@/stores/model'
import {
  AgentStructuredOutputField,
  AgentExceptionMethod,
  NodeHandleId,
  VariableType,
} from '../../constant'
import { useSaveOnBlur } from '../../hooks/use-save-on-blur'
import { useBuildPromptVariableOptions } from '../../hooks/use-get-begin-query'
import useGraphStore from '../../store'
import type { INextOperatorForm } from '../../types'
import { hasSubAgentOrTool, isBottomSubAgent } from '../../utils'
import {
  DescriptionField,
  FormWrapper,
  Output,
  QueryVariable,
  SchemaDialog,
  SchemaPanel,
  transferOutputs,
} from '../components'
import { LLMSelectField } from '../components/llm-select-field'
import { AgentAdvancedSettings } from './components/agent-advanced-settings'
import { Agents, AgentTools } from './tools'
import { useBuildPromptExtraPromptOptions } from './use-build-prompt-options'
import { useStructuredOutputDialog } from './use-show-structured-output-dialog'
import { useValues } from './use-values'
import { useWatchFormChange } from './use-watch-change'
import { PromptEditor } from '@/components/prompt-editor'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

const schema = z.object({
  llm_id: z.string().optional(),
  temperature: z.coerce.number().optional(),
  top_p: z.coerce.number().optional(),
  presence_penalty: z.coerce.number().optional(),
  frequency_penalty: z.coerce.number().optional(),
  max_tokens: z.coerce.number().optional(),
  sys_prompt: z.string().optional(),
  description: z.string().optional(),
  prompts: z.string().optional(),
  showStructuredOutput: z.boolean().optional(),
  message_history_window_size: z.coerce.number().optional(),
  max_retries: z.coerce.number().optional(),
  delay_after_error: z.coerce.number().optional(),
  max_rounds: z.coerce.number().optional(),
  cite: z.boolean().optional(),
  exception_method: z.string().optional(),
  exception_goto: z.array(z.string()).optional(),
  exception_default_value: z.string().optional(),
  visual_files_var: z.string().optional(),
})

type AgentFormValues = z.input<typeof schema>

export function AgentForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const { myLLMs } = useFetchMyLLMs()
  const { handleSaveOnBlur } = useSaveOnBlur()
  const edges = useGraphStore((state) => state.edges)
  const deleteEdgesBySourceAndSourceHandle = useGraphStore(
    (state) => state.deleteEdgesBySourceAndSourceHandle,
  )
  const values = useValues(node) as AgentFormValues

  const form = useForm<AgentFormValues, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: values as AgentFormValues,
  })

  useWatchFormChange(node?.id, form)

  const llmId = useWatch({ control: form.control, name: 'llm_id' })
  const showStructuredOutput = useWatch({
    control: form.control,
    name: 'showStructuredOutput',
  })
  const exceptionMethod = useWatch({
    control: form.control,
    name: 'exception_method',
  })

  const outputs = useMemo(
    () => transferOutputs(node?.data?.form?.outputs),
    [node?.data?.form?.outputs],
  )
  const structuredOutput = get(
    node,
    `data.form.outputs.${AgentStructuredOutputField}`,
  )
  const isSubAgent = useMemo(
    () => isBottomSubAgent(edges, node?.id),
    [edges, node?.id],
  )
  const hasRoundControl = useMemo(
    () => hasSubAgentOrTool(edges, node?.id),
    [edges, node?.id],
  )
  const supportsImageInput = useMemo(() => {
    if (!llmId) {
      return false
    }

    const resolvedLlm = resolveLLMValue(myLLMs, llmId, true)
    if (!resolvedLlm.providerName || !resolvedLlm.matched) {
      return false
    }

    return myLLMs[resolvedLlm.providerName]?.tags?.includes('IMAGE2TEXT') ?? false
  }, [llmId, myLLMs])
  const promptOptions = useBuildPromptVariableOptions(node?.id)
  const { extraOptions } = useBuildPromptExtraPromptOptions(edges, node?.id)
  const structuredOutputDialog = useStructuredOutputDialog(node?.id)

  useEffect(() => {
    if (
      node?.id &&
      exceptionMethod !== AgentExceptionMethod.Goto
    ) {
      deleteEdgesBySourceAndSourceHandle(node.id, NodeHandleId.AgentException)
    }
  }, [
    deleteEdgesBySourceAndSourceHandle,
    exceptionMethod,
    node?.id,
  ])

  return (
    <>
      <Form {...form}>
        <FormWrapper>
          {isSubAgent && <DescriptionField />}

          <LLMSelectField type="chat" valueMode="nameWithProvider" />

          {supportsImageInput && (
            <QueryVariable
              name="visual_files_var"
              label={t('flow.visualInputFile', 'Visual Input File')}
              types={[VariableType.File]}
              nodeId={node?.id}
            />
          )}

          <FormField
            control={form.control}
            name="sys_prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.systemPrompt', 'System Prompt')}</FormLabel>
                <FormControl>
                  <PromptEditor
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    options={promptOptions}
                    extraOptions={extraOptions}
                    nodeId={node?.id}
                    placeholder={t(
                      'flow.messagePlaceholder',
                      'Write the prompt...',
                    )}
                    onBlur={handleSaveOnBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isSubAgent && (
            <FormField
              control={form.control}
              name="prompts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('flow.userPrompt', 'User Prompt')}</FormLabel>
                  <FormControl>
                    <PromptEditor
                      value={(field.value as string) ?? ''}
                      onChange={field.onChange}
                      options={promptOptions}
                      nodeId={node?.id}
                      onBlur={handleSaveOnBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Separator className="my-space-xs" />

          <AgentTools node={node} />
          <Agents node={node} />

          <AgentAdvancedSettings showMaxRounds={hasRoundControl} />

          <Output list={outputs}>
            <div className="flex items-center gap-space-sm">
              <span className="text-sm text-text-secondary">
                {t(
                  'flow.structuredOutput.structuredOutput',
                  'Structured Output',
                )}
              </span>
              <Switch
                checked={Boolean(showStructuredOutput)}
                onCheckedChange={(checked) => {
                  form.setValue('showStructuredOutput', checked, {
                    shouldDirty: true,
                  })
                  structuredOutputDialog.toggle(checked)
                }}
              />
              {showStructuredOutput && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={structuredOutputDialog.show}
                >
                  {t(
                    'flow.structuredOutput.configuration',
                    'Configuration',
                  )}
                </Button>
              )}
            </div>
          </Output>

          {showStructuredOutput && structuredOutput && (
            <SchemaPanel value={structuredOutput as never} />
          )}
        </FormWrapper>
      </Form>

      {structuredOutputDialog.visible && (
        <SchemaDialog
          hideModal={structuredOutputDialog.hide}
          onOk={structuredOutputDialog.handleOk}
          initialValues={structuredOutputDialog.initialValues}
        />
      )}
    </>
  )
}
