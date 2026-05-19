import { LayoutRecognizeFormField } from '@/components/forms/KnowledgeFormFields'
import { PromptEditor } from '@/components/prompt-editor'
import { Button } from '@/components/ui/button'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { memo, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { BeginQueryType } from '../../constant'
import { useBuildPromptVariableOptions } from '../../hooks/use-get-begin-query'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output } from '../components'
import { ParameterDialog } from '../begin/parameter-dialog'
import { QueryTable } from '../begin/query-table'
import { beginInputSchema } from '../begin/schema'
import { useEditQueryRecord } from '../begin/use-edit-query'
import type { BeginInputEditorItem } from '../begin/utils'
import { useValues } from './use-values'
import { useWatchFormChange } from './use-watch-change'

const userFillUpSchema = z.object({
  enable_tips: z.boolean().optional(),
  tips: z.string().optional(),
  layout_recognize: z.string().optional(),
  inputs: z.array(beginInputSchema).optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

type UserFillUpFormValues = z.infer<typeof userFillUpSchema>

export const UserFillUpForm = memo(function UserFillUpForm({
  node,
}: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useValues(node)
  const promptOptions = useBuildPromptVariableOptions(node?.id)

  const form = useForm<UserFillUpFormValues>({
    resolver: zodResolver(userFillUpSchema),
    defaultValues: values as UserFillUpFormValues,
    mode: 'onChange',
  })

  useWatchFormChange(node?.id, form)

  const watchedInputs = useWatch({ control: form.control, name: 'inputs' })
  const inputs = useMemo(
    () => (watchedInputs || []) as BeginInputEditorItem[],
    [watchedInputs],
  )
  const hasFileInput = useMemo(
    () =>
      Array.isArray(inputs) &&
      inputs.some((item) => item?.type === BeginQueryType.File),
    [inputs],
  )
  const {
    ok,
    currentRecord,
    open,
    hideModal,
    showModal,
    otherThanCurrentQuery,
    handleDeleteRecord,
  } = useEditQueryRecord({
    form,
  })

  const outputList = useMemo(
    () =>
      (inputs || []).map((item) => ({
        title: item?.name || '',
        type: item?.type || '',
      })),
    [inputs],
  )

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="enable_tips"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel
                tooltip={t(
                  'flow.guidingQuestionTip',
                  'Show a guiding question before the form.',
                )}
              >
                {t('flow.guidingQuestion', 'Guiding Question')}
              </FormLabel>
              <FormControl>
                <Switch
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tips"
          render={({ field }) => (
            <FormItem>
              <FormLabel
                tooltip={t(
                  'flow.guidingQuestionTip',
                  'Shown before the user fills in the form.',
                )}
              >
                {t('flow.msg', 'Message')}
              </FormLabel>
              <FormControl>
                <PromptEditor
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  options={promptOptions}
                  nodeId={node?.id}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="inputs"
          render={() => <div />}
        />
        <CollapsibleSection
          title={t('flow.input', 'Input')}
          defaultOpen
          extra={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => showModal()}
            >
              <Plus className="size-4" />
            </Button>
          }
        >
          <QueryTable
            data={inputs}
            showModal={showModal}
            deleteRecord={handleDeleteRecord}
          />
        </CollapsibleSection>

        {hasFileInput && (
          <LayoutRecognizeFormField
            name="layout_recognize"
            horizontal={false}
          />
        )}

        <ParameterDialog
          open={open}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              hideModal()
            }
          }}
          initialValue={currentRecord}
          otherThanCurrentQuery={otherThanCurrentQuery}
          submit={ok}
        />

        <Output list={outputList} />
      </FormWrapper>
    </Form>
  )
})
