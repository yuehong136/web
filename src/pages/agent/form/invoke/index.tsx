import { PromptEditor } from '@/components/prompt-editor'
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
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialInvokeValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import {
  CompactRecordList,
  CompactRecordRow,
  FormWrapper,
  JsonCodeEditor,
  Output,
  QueryVariable,
  buildOutputList,
} from '../components'
import { invokeMethodOptions } from './constants'
import { createInvokeFormSchema } from './schema'
import { invokeDatatypeOptions, normalizeInvokeFormForStore } from './utils'

export function InvokeForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = normalizeInvokeFormForStore(
    useFormValues(initialInvokeValues, node),
  )

  // Schema messages depend on the current language; rebuild when t changes.
  const schema = useMemo(() => createInvokeFormSchema(t), [t])

  const form = useForm<
    z.input<typeof schema>,
    unknown,
    z.output<typeof schema>
  >({
    resolver: zodResolver(schema),
    defaultValues: values as z.input<typeof schema>,
    mode: 'onChange',
  })

  useWatchFormChange(node?.id, form)

  const outputs = useMemo(
    () => buildOutputList(form.getValues('outputs')),
    [form],
  )

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.url', 'URL')}</FormLabel>
              <FormControl>
                <PromptEditor
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="https://api.example.com/{begin@user_id}"
                  nodeId={node?.id}
                  showToolbar={false}
                  multiLine={false}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="gap-space-md grid md:grid-cols-3">
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
            <FormItem className="rounded-radius-md px-space-sm py-space-sm flex items-center justify-between border border-border-default">
              <FormLabel
                tooltip={t(
                  'flow.cleanHtmlTip',
                  'Turn this on if the response is HTML and you only need the main content.',
                )}
              >
                {t('flow.cleanHtml', 'Clean HTML')}
              </FormLabel>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <CompactRecordList
          name="variables"
          label={t('flow.parameter', 'Parameters')}
          addLabel={t('common.add', 'Add')}
          emptyLabel={t('flow.noParameters', 'No parameters yet')}
          defaultValue={{ key: '', ref: '', value: '' }}
        >
          {({ field, index, ctx }) => (
            <CompactRecordRow key={field.id} onRemove={() => ctx.remove(index)}>
              <FormField
                control={form.control}
                name={`variables.${index}.key`}
                render={({ field: inputField }) => (
                  <FormItem className="flex-[0_0_8rem]">
                    <FormControl>
                      <Input
                        {...inputField}
                        value={inputField.value ?? ''}
                        placeholder={t('flow.key', 'Key')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <QueryVariable
                name={`variables.${index}.ref`}
                hideLabel
                className="min-w-0 flex-1"
                nodeId={node?.id}
              />

              <FormField
                control={form.control}
                name={`variables.${index}.value`}
                render={({ field: inputField }) => (
                  <FormItem className="min-w-0 flex-1">
                    <FormControl>
                      <Input
                        {...inputField}
                        value={inputField.value ?? ''}
                        placeholder={t('flow.value', 'Value')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CompactRecordRow>
          )}
        </CompactRecordList>

        <Separator />
        <Output list={outputs} />
      </FormWrapper>
    </Form>
  )
}
