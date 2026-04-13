import { PromptEditor } from '@/components/prompt-editor'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialExtractorValues } from '../../constant'
import { useBuildNodeOutputOptions } from '../../hooks/use-build-options'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output, buildOutputList } from '../components'
import { LlmSetting } from '../components/llm-setting'
import {
  extractorFieldName,
  getExtractorPromptPreset,
  normalizeExtractorFormForStore,
} from './utils'

const extractorSchema = z.object({
  llm_id: z.string().optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  presence_penalty: z.number().optional(),
  frequency_penalty: z.number().optional(),
  max_tokens: z.number().optional(),
  field_name: z.string().optional(),
  sys_prompt: z.string().optional(),
  prompts: z.string().optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

const extractorFieldOptions = [
  extractorFieldName.Summary,
  extractorFieldName.Keywords,
  extractorFieldName.Questions,
  extractorFieldName.Metadata,
  extractorFieldName.Toc,
]

type ExtractorFormValues = z.input<typeof extractorSchema>

export function ExtractorForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const promptOptions = useBuildNodeOutputOptions(node?.id)
  const values = normalizeExtractorFormForStore(
    useFormValues(initialExtractorValues, node),
  )
  const [pendingFieldName, setPendingFieldName] = useState<string | null>(null)
  const [previousFieldName, setPreviousFieldName] = useState(values.field_name)

  const form = useForm<
    ExtractorFormValues,
    unknown,
    z.output<typeof extractorSchema>
  >({
    resolver: zodResolver(extractorSchema),
    defaultValues: values as ExtractorFormValues,
  })

  useWatchFormChange(node?.id, form)

  const outputs = useMemo(() => buildOutputList(form.getValues('outputs')), [form])

  const applyFieldPreset = (fieldName: string) => {
    const preset = getExtractorPromptPreset(fieldName)
    form.setValue('field_name', fieldName, { shouldDirty: true })
    form.setValue('sys_prompt', preset.sys_prompt, { shouldDirty: true })
    form.setValue('prompts', preset.prompts, { shouldDirty: true })
    setPreviousFieldName(fieldName)
  }

  const handleFieldNameChange = (fieldName: string) => {
    const currentFieldName = form.getValues('field_name')
    const currentPreset = getExtractorPromptPreset(currentFieldName)
    const isCustomized =
      form.getValues('sys_prompt') !== currentPreset.sys_prompt ||
      form.getValues('prompts') !== currentPreset.prompts

    if (isCustomized) {
      setPendingFieldName(fieldName)
      form.setValue('field_name', currentFieldName, { shouldDirty: false })
      return
    }

    applyFieldPreset(fieldName)
  }

  return (
    <Form {...form}>
      <FormWrapper>
        <LlmSetting />

        <FormField
          control={form.control}
          name="field_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.fieldName', 'Field Name')}</FormLabel>
              <FormControl>
                <Select
                  value={field.value ?? extractorFieldName.Summary}
                  onValueChange={(value) => {
                    field.onChange(value)
                    handleFieldNameChange(value)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {extractorFieldOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />

        {form.watch('field_name') !== extractorFieldName.Toc && (
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
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="prompts"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {form.watch('field_name') === extractorFieldName.Toc
                  ? t('flow.tocDataSource', 'TOC Data Source')
                  : t('flow.userPrompt', 'User Prompt')}
              </FormLabel>
              <FormControl>
                <PromptEditor
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  options={promptOptions}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Output list={outputs} />
      </FormWrapper>

      <AlertDialog open={Boolean(pendingFieldName)} onOpenChange={(open) => !open && setPendingFieldName(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('flow.switchPrompt', 'Switch prompt preset')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'flow.switchPromptMessage',
                'Changing the field will replace the current prompt preset.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                form.setValue('field_name', previousFieldName, {
                  shouldDirty: false,
                })
                setPendingFieldName(null)
              }}
            >
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingFieldName) {
                  applyFieldPreset(pendingFieldName)
                }
                setPendingFieldName(null)
              }}
            >
              {t('common.confirm', 'Confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  )
}
