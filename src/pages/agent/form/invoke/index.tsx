import { PromptEditor } from '@/components/prompt-editor'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialInvokeValues } from '../../constant'
import { useBuildNodeOutputOptions } from '../../hooks/use-build-options'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import {
  FormWrapper,
  JsonCodeEditor,
  Output,
  QueryVariable,
  buildOutputList,
} from '../components'
import { invokeMethodOptions } from './constants'
import { invokeFormSchema } from './schema'
import {
  invokeDatatypeOptions,
  normalizeInvokeFormForStore,
} from './utils'

type InvokeFormValues = z.input<typeof invokeFormSchema>

export function InvokeForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const promptOptions = useBuildNodeOutputOptions(node?.id)
  const values = normalizeInvokeFormForStore(
    useFormValues(initialInvokeValues, node),
  )

  const form = useForm<
    InvokeFormValues,
    unknown,
    z.output<typeof invokeFormSchema>
  >({
    resolver: zodResolver(invokeFormSchema),
    defaultValues: values as InvokeFormValues,
    mode: 'onChange',
  })

  const variablesFieldArray = useFieldArray({
    control: form.control,
    name: 'variables',
  })

  useWatchFormChange(node?.id, form)

  const outputs = useMemo(() => buildOutputList(form.getValues('outputs')), [form])

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <PromptEditor
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="https://api.example.com/{begin@user_id}"
                  options={promptOptions}
                  showToolbar={false}
                  multiLine={false}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-space-md md:grid-cols-3">
          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.method', 'Method')}</FormLabel>
                <FormControl>
                  <Select
                    value={field.value ?? 'GET'}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {invokeMethodOptions.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="datatype"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.datatype', 'Datatype')}</FormLabel>
                <FormControl>
                  <Select
                    value={field.value ?? 'json'}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {invokeDatatypeOptions.map((datatype) => (
                        <SelectItem key={datatype} value={datatype}>
                          {datatype}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeout"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.timeout', 'Timeout (s)')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    value={field.value ?? initialInvokeValues.timeout}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="headers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.headers', 'Headers')}</FormLabel>
              <FormControl>
                <JsonCodeEditor value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="proxy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.proxy', 'Proxy')}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="clean_html"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-radius-md border border-border-default px-space-sm py-space-sm">
              <FormLabel>{t('flow.cleanHtml', 'Clean HTML')}</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <section className="space-y-space-md rounded-radius-md border border-border-default p-space-base">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-text-primary">
              {t('flow.parameter', 'Parameters')}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                variablesFieldArray.append({ key: '', ref: '', value: '' })
              }
            >
              <Plus className="mr-space-xs size-4" />
              {t('common.add', 'Add')}
            </Button>
          </div>

          {variablesFieldArray.fields.map((variableField, index) => (
            <div
              key={variableField.id}
              className="space-y-space-sm rounded-radius-md border border-border-default p-space-sm"
            >
              <div className="grid gap-space-sm md:grid-cols-[0.8fr_1.2fr]">
                <FormField
                  control={form.control}
                  name={`variables.${index}.key`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('flow.key', 'Key')}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <QueryVariable
                  name={`variables.${index}.ref`}
                  label={t('flow.ref', 'Ref')}
                  nodeId={node?.id}
                />
              </div>

              <FormField
                control={form.control}
                name={`variables.${index}.value`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('flow.value', 'Value')}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => variablesFieldArray.remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </section>

        <Separator />
        <Output list={outputs} />
      </FormWrapper>
    </Form>
  )
}
