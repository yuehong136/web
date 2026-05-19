import { LayoutRecognizeFormField } from '@/components/forms/KnowledgeFormFields'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Form } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { AgentDialogueMode, BeginQueryType } from '../../constant'
import type { INextOperatorForm } from '../../types'
import { FormWrapper } from '../components'
import { ParameterDialog } from './parameter-dialog'
import { QueryTable } from './query-table'
import { beginFormSchema, type BeginFormValues } from './schema'
import { useEditQueryRecord } from './use-edit-query'
import { useHandleModeChange } from './use-handle-mode-change'
import { useValues } from './use-values'
import { useWatchFormChange } from './use-watch-change'
import { BeginWebhookFields } from './webhook'

export function BeginForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useValues(node)

  const form = useForm<BeginFormValues>({
    resolver: zodResolver(beginFormSchema),
    defaultValues: values as BeginFormValues,
    mode: 'onChange',
  })

  useWatchFormChange(node?.id, form)
  const { handleModeChange } = useHandleModeChange(form)

  const mode = useWatch({ control: form.control, name: 'mode' })
  const enablePrologue = useWatch({
    control: form.control,
    name: 'enablePrologue',
  })
  const watchedInputs = useWatch({
    control: form.control,
    name: 'inputs',
  })
  const inputs = useMemo(
    () => (watchedInputs || []) as NonNullable<BeginFormValues['inputs']>,
    [watchedInputs],
  )

  const hasFileInput = useMemo(
    () =>
      Array.isArray(inputs) &&
      inputs.some((item) => item?.type === BeginQueryType.File),
    [inputs],
  )

  const previousModeRef = useRef(mode)
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

  useEffect(() => {
    if (
      previousModeRef.current === AgentDialogueMode.Task &&
      mode === AgentDialogueMode.Conversational
    ) {
      form.setValue('enablePrologue', true, { shouldDirty: true })
    }

    previousModeRef.current = mode
  }, [form, mode])

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel
                tooltip={t('flow.modeTip', 'Choose how the flow starts.')}
              >
                {t('flow.mode', 'Mode')}
              </FormLabel>
              <FormControl>
                <Select
                  value={field.value || AgentDialogueMode.Conversational}
                  onValueChange={(value) => {
                    handleModeChange(value)
                    field.onChange(value)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AgentDialogueMode.Conversational}>
                      {t('flow.conversational', 'Conversational')}
                    </SelectItem>
                    <SelectItem value={AgentDialogueMode.Task}>
                      {t('flow.task', 'Task')}
                    </SelectItem>
                    <SelectItem value={AgentDialogueMode.Webhook}>
                      {t('flow.webhook.name', 'Webhook')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {mode === AgentDialogueMode.Conversational && (
          <FormField
            control={form.control}
            name="enablePrologue"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel
                  tooltip={t(
                    'flow.openingSwitchTip',
                    'Turn on the opening message.',
                  )}
                >
                  {t('flow.openingSwitch', 'Enable opening')}
                </FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value ?? true}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {mode === AgentDialogueMode.Conversational && enablePrologue && (
          <FormField
            control={form.control}
            name="prologue"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  tooltip={t(
                    'flow.openingCopyTip',
                    'Shown before the conversation begins.',
                  )}
                >
                  {t('flow.openingCopy', 'Opening')}
                </FormLabel>
                <FormControl>
                  <Textarea rows={5} {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {mode === AgentDialogueMode.Webhook ? (
          <BeginWebhookFields />
        ) : (
          <>
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
                showMineruOptions={false}
                showPaddleocrOptions={false}
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
          </>
        )}
      </FormWrapper>
    </Form>
  )
}
