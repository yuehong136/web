import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { lazy, Suspense, useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  CodeTemplateStrMap,
  ProgrammingLanguage,
  initialCodeValues,
} from '../constant'
import { useFormValues } from '../hooks/use-form-values'
import { useSyncCodeOutputs } from '../hooks/use-sync-code-outputs'
import { useWatchFormChange } from '../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../types'
import {
  type CodeOutputMap,
  deserializeCodeOutputContract,
  getCodeNodeOutputs,
  serializeCodeOutputContract,
} from '../utils/code-outputs'
import { CodeTemplateId, CodeTemplatePresetMap } from '../utils/code-templates'
import {
  CodeRuntimeOverview,
  ParameterPreview,
} from './code/code-runtime-sections'
import { CodeTemplateSelector } from './code/code-template-selector'
import { ReturnValueEditor } from './code/return-value-editor'
import type {
  CodeTemplateIdValue,
  ProgrammingLanguageValue,
} from './code/types'
import { FormWrapper } from './components'

const CodeScriptEditor = lazy(async () => {
  const module = await import('./code/code-script-editor')
  return { default: module.CodeScriptEditor }
})

const schema = z.object({
  lang: z.string(),
  script: z.string().optional(),
  arguments: z.record(z.string(), z.unknown()).optional(),
  outputs: z.record(z.string(), z.unknown()).optional(),
})

function CodeEditorFallback() {
  const { t } = useTranslation()

  return (
    <output
      className="rounded-radius-lg gap-space-sm bg-surface-secondary flex h-80 items-center justify-center border border-border-default text-sm text-text-secondary"
      aria-live="polite"
    >
      <Loader2 className="size-icon-md animate-spin" />
      {t('flow.codeEditorLoading', 'Loading code editor…')}
    </output>
  )
}

export function CodeForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialCodeValues, node)
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<CodeTemplateIdValue>(CodeTemplateId.StringResult)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const watchedLanguage = form.watch('lang') as ProgrammingLanguageValue
  const watchedArguments = form.watch('arguments') as
    | Record<string, unknown>
    | undefined
  const watchedOutputs = form.watch('outputs') as CodeOutputMap | undefined
  const outputs = getCodeNodeOutputs(watchedOutputs)
  const externalOutputs = values.outputs as CodeOutputMap | undefined
  useSyncCodeOutputs(form, externalOutputs)

  const applyTemplate = useCallback(
    (
      templateId: CodeTemplateIdValue,
      nextLanguage?: ProgrammingLanguageValue,
    ) => {
      const preset = CodeTemplatePresetMap[templateId]
      const preferredLanguage =
        preset.language ??
        nextLanguage ??
        watchedLanguage ??
        ProgrammingLanguage.Python
      const script = preset.scripts[preferredLanguage]
      const { contract } = deserializeCodeOutputContract({
        outputs: form.getValues('outputs') as CodeOutputMap | undefined,
      })

      setSelectedTemplateId(templateId)
      form.setValue('lang', preferredLanguage, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
      form.setValue('script', script, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
      form.setValue(
        'outputs',
        serializeCodeOutputContract({
          name: contract.name,
          type: preset.outputType,
        }),
        {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        },
      )
    },
    [form, watchedLanguage],
  )

  return (
    <Form {...form}>
      <FormWrapper>
        <div className="gap-space-base grid sm:grid-cols-2">
          <FormField
            control={form.control}
            name="lang"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.language', 'Language')}</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      const nextLanguage = val as ProgrammingLanguageValue
                      field.onChange(nextLanguage)
                      const nextTemplateId =
                        selectedTemplateId === CodeTemplateId.CsvArtifact
                          ? CodeTemplateId.StringResult
                          : selectedTemplateId
                      const template =
                        CodeTemplatePresetMap[nextTemplateId].scripts[
                          nextLanguage
                        ] ?? CodeTemplateStrMap[nextLanguage]

                      setSelectedTemplateId(nextTemplateId)
                      if (template) {
                        form.setValue('script', template, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ProgrammingLanguage.Python}>
                        Python
                      </SelectItem>
                      <SelectItem value={ProgrammingLanguage.JavaScript}>
                        JavaScript
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <CodeTemplateSelector
            value={selectedTemplateId}
            onApply={(templateId) => applyTemplate(templateId)}
          />
        </div>

        <FormField
          control={form.control}
          name="script"
          render={({ field }) => (
            <FormItem>
              <Suspense fallback={<CodeEditorFallback />}>
                <CodeScriptEditor
                  value={field.value ?? ''}
                  language={watchedLanguage}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </Suspense>
              <FormDescription>
                {t(
                  'flow.codeMainReturnTip',
                  'Return a JSON-serializable value from main(). It will be exposed as the single business output below.',
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <ParameterPreview
          argumentsValue={watchedArguments}
          language={watchedLanguage}
        />

        <ReturnValueEditor
          outputs={watchedOutputs}
          onChange={(nextOutputs) =>
            form.setValue('outputs', nextOutputs, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
        />

        <CodeRuntimeOverview outputs={outputs} />
      </FormWrapper>
    </Form>
  )
}
