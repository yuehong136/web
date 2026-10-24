import { useParams } from 'react-router-dom'
import { FileUploadDirectUpload } from '../../debug-content/uploader'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { PromptEditor } from '@/components/prompt-editor'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  useFormField,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useFormValues } from '../../hooks/use-form-values'
import { useBuildPromptVariableOptions } from '../../hooks/use-get-begin-query'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output, transferOutputs } from '../components'
import { LLMSelectField } from '../components/llm-select-field'
import { initialBrowserValues, type BrowserFormValues } from './constants'
import { browserFormSchema } from './schema'

function BrowserFieldMessage({ children }: { children: string }) {
  const { formMessageId } = useFormField()
  return (
    <p id={formMessageId} role="alert" className="text-sm text-status-error">
      {children}
    </p>
  )
}

const switches = [
  ['headless', 'headless'],
  ['enable_default_extensions', 'enableDefaultExtensions'],
  ['chromium_sandbox', 'chromiumSandbox'],
  ['persist_session', 'persistSession'],
] as const
const numbers = [
  ['max_steps', 'maxSteps', 1, undefined, 1],
  ['temperature', 'temperature', 0, 2, 0.1],
  ['max_retries', 'maxRetries', 0, undefined, 1],
] as const

export function BrowserForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const { id: canvasId } = useParams<{ id: string }>()
  const values = useFormValues(initialBrowserValues, node)
  const form = useForm<BrowserFormValues>({
    defaultValues: values,
    resolver: zodResolver(browserFormSchema, {
      error: (issue) =>
        t(
          issue.path?.[0] === 'llm_id'
            ? 'flow.browserRequiredModel'
            : 'flow.browserInvalidNumber',
        ),
    }),
    mode: 'onChange',
  })
  const options = useBuildPromptVariableOptions(node?.id)
  useWatchFormChange(node?.id, form)

  return (
    <Form {...form}>
      <FormWrapper>
        <LLMSelectField type="chat" valueMode="nameWithProvider" />
        <FormField
          control={form.control}
          name="prompts"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>{t('flow.userPrompt')}</FormLabel>
              <FormControl>
                <PromptEditor
                  {...field}
                  aria-label={t('flow.userPrompt')}
                  options={options}
                  showToolbar
                />
              </FormControl>
              {fieldState.error && (
                <BrowserFieldMessage>
                  {t('flow.browserRequiredPrompt')}
                </BrowserFieldMessage>
              )}
            </FormItem>
          )}
        />
        {numbers.map(([name, key, min, max, step]) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>{t(`flow.${key}`)}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={Number.isFinite(field.value) ? field.value : ''}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === ''
                          ? Number.NaN
                          : Number(event.target.value),
                      )
                    }
                  />
                </FormControl>
                {fieldState.error && (
                  <BrowserFieldMessage>
                    {t('flow.browserInvalidNumber')}
                  </BrowserFieldMessage>
                )}
              </FormItem>
            )}
          />
        ))}
        {switches.map(([name, key]) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between gap-space-base">
                  <FormLabel>{t(`flow.${key}`)}</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
                {name !== 'headless' && (
                  <FormDescription>{t(`flow.${key}Tip`)}</FormDescription>
                )}
              </FormItem>
            )}
          />
        ))}
        <FormField
          control={form.control}
          name="upload_sources"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.uploadSources')}</FormLabel>
              <FormDescription>{t('flow.uploadSourcesTip')}</FormDescription>
              <FileUploadDirectUpload
                canvasId={canvasId}
                value={[]}
                multiple
                showFileList={false}
                buttonLabel={t('flow.browserUploadFiles')}
                onChange={(uploaded) => {
                  const descriptors = Array.isArray(uploaded)
                    ? uploaded
                    : [uploaded]
                  form.setValue(
                    'upload_sources',
                    [
                      ...form.getValues('upload_sources'),
                      ...descriptors.filter(
                        (item): item is Record<string, unknown> =>
                          item !== null && typeof item === 'object',
                      ),
                    ],
                    { shouldDirty: true, shouldValidate: true },
                  )
                }}
              />
              {field.value.map((source, index) => (
                <div key={index} className="flex items-start gap-space-sm">
                  <div
                    className="min-w-0 flex-1"
                    role="group"
                    aria-label={t('flow.uploadSourceLabel', {
                      index: index + 1,
                    })}
                  >
                    {typeof source === 'string' ? (
                      <PromptEditor
                        value={source}
                        onChange={(value) =>
                          field.onChange(
                            field.value.map((entry, offset) =>
                              offset === index ? (value ?? '') : entry,
                            ),
                          )
                        }
                        options={options}
                        showToolbar
                        multiLine={false}
                        placeholder={t('flow.uploadSourcePlaceholder')}
                        aria-label={t('flow.uploadSourceLabel', {
                          index: index + 1,
                        })}
                      />
                    ) : (
                      <>
                        <Input
                          readOnly
                          value={
                            typeof source.name === 'string'
                              ? source.name
                              : typeof source.id === 'string'
                                ? source.id
                                : typeof source.file_id === 'string'
                                  ? source.file_id
                                  : t('flow.browserUploadedFile')
                          }
                          aria-label={t('flow.uploadSourceLabel', {
                            index: index + 1,
                          })}
                        />
                        <p className="text-sm text-text-tertiary">
                          {t('flow.browserUploadedFile')}
                        </p>
                      </>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t('flow.removeUploadSource', {
                      index: index + 1,
                    })}
                    onClick={() =>
                      field.onChange(
                        field.value.filter((_, offset) => offset !== index),
                      )
                    }
                  >
                    <Trash2 className="size-icon-sm" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => field.onChange([...field.value, ''])}
              >
                <Plus className="size-icon-sm" />
                {t('flow.addUploadSource')}
              </Button>
            </FormItem>
          )}
        />
        <Output list={transferOutputs(form.watch('outputs'))} />
      </FormWrapper>
    </Form>
  )
}
