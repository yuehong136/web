import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { type ReactNode, useCallback, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { BeginQueryType } from '../constant'
import type { BeginQuery } from '../types'
import { PersonDataMultiSelect } from '../components/persondata-multi-select'
import { FileUploadDirectUpload } from './uploader'

const StringFields = [
  BeginQueryType.Line,
  BeginQueryType.Paragraph,
  BeginQueryType.Options,
]

interface IProps {
  canvasId?: string
  parameters: BeginQuery[]
  ok(parameters: BeginQuery[]): void | Promise<void>
  isNext?: boolean
  loading?: boolean
  submitButtonDisabled?: boolean
  btnText?: ReactNode
  className?: string
  maxHeight?: string
}

const resolveOptionValue = (query: BeginQuery, value: unknown) => {
  if (!Array.isArray(query.options)) {
    return value
  }

  return query.options.find((item) => String(item) === String(value)) ?? value
}

const DebugContent = ({
  canvasId,
  parameters,
  ok,
  isNext = true,
  loading = false,
  submitButtonDisabled = false,
  btnText,
  className,
  maxHeight,
}: IProps) => {
  const { t } = useTranslation()

  const formSchemaValues = useMemo(() => {
    const obj = parameters.reduce<{
      schema: Record<string, z.ZodType>
      values: Record<string, unknown>
    }>(
      (pre, cur, idx) => {
        const type = cur.type
        let fieldSchema: z.ZodType
        let value: unknown

        if (StringFields.some((x) => x === type)) {
          fieldSchema = z.string().trim()
          if (!cur.optional) {
            fieldSchema = (fieldSchema as z.ZodString).min(1)
          }
          value = ''
        } else if (type === BeginQueryType.File) {
          const fileSchema = z.array(z.object({}).passthrough())
          fieldSchema = cur.optional ? fileSchema : fileSchema.min(1)
          value = []
        } else if (type === BeginQueryType.Boolean) {
          fieldSchema = z.boolean()
          value = false
        } else if (type === BeginQueryType.Integer || type === 'float') {
          fieldSchema = z.coerce.number()
          value = 0
        } else if (type === BeginQueryType.PersonData) {
          const personDataSchema = z.array(z.string())
          fieldSchema = cur.optional
            ? personDataSchema
            : personDataSchema.min(1)
          value = []
        } else {
          fieldSchema = z.any()
          value = null
        }

        if (cur.optional) {
          fieldSchema = fieldSchema.optional()
        }

        const index = idx.toString()
        pre.schema[index] = fieldSchema
        pre.values[index] = value

        return pre
      },
      { schema: {}, values: {} },
    )

    return { schema: z.object(obj.schema), values: obj.values }
  }, [parameters])

  const form = useForm<z.infer<typeof formSchemaValues.schema>>({
    defaultValues: formSchemaValues.values,
    resolver: zodResolver(formSchemaValues.schema),
  })

  useEffect(() => {
    form.reset(formSchemaValues.values)
  }, [form, formSchemaValues.values])

  const renderWidget = useCallback(
    (q: BeginQuery, idx: string) => {
      const props = {
        key: idx,
        label: q.name ?? q.key,
        name: idx,
      }

      const BeginQueryTypeWidgetMap: Record<string, ReactNode> = {
        [BeginQueryType.Line]: (
          <FormField
            key={idx}
            control={form.control}
            name={props.name}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>{props.label}</FormLabel>
                <FormControl>
                  <Input {...field} value={(field.value as string) || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ),
        [BeginQueryType.Paragraph]: (
          <FormField
            key={idx}
            control={form.control}
            name={props.name}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>{props.label}</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    {...field}
                    value={(field.value as string) || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ),
        [BeginQueryType.Options]: (
          <FormField
            key={idx}
            control={form.control}
            name={props.name}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>{props.label}</FormLabel>
                <FormControl>
                  <Select
                    value={typeof field.value === 'string' ? field.value : ''}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.select', '请选择')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(q.options || []).map((option) => (
                        <SelectItem key={String(option)} value={String(option)}>
                          {String(option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ),
        [BeginQueryType.Integer]: (
          <FormField
            key={idx}
            control={form.control}
            name={props.name}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>{props.label}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={(field.value as number) || 0}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ),
        [BeginQueryType.Boolean]: (
          <FormField
            key={idx}
            control={form.control}
            name={props.name}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>{props.label}</FormLabel>
                <FormControl>
                  <Switch
                    checked={(field.value as boolean) || false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ),
        [BeginQueryType.File]: (
          <FormField
            key={idx}
            control={form.control}
            name={props.name}
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>{props.label}</FormLabel>
                <FormControl>
                  <FileUploadDirectUpload
                    canvasId={canvasId}
                    value={field.value}
                    onChange={field.onChange}
                    multiple
                    maxFiles={5}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ),
        [BeginQueryType.PersonData]: (
          <FormField
            key={idx}
            control={form.control}
            name={props.name}
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>{props.label}</FormLabel>
                <FormControl>
                  <PersonDataMultiSelect
                    workflowId={canvasId}
                    value={Array.isArray(field.value) ? field.value : []}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ),
      }

      return (
        BeginQueryTypeWidgetMap[q.type as BeginQueryType] ??
        BeginQueryTypeWidgetMap[BeginQueryType.Paragraph]
      )
    },
    [canvasId, form, t],
  )

  const onSubmit = useCallback(
    (values: z.infer<typeof formSchemaValues.schema>) => {
      const nextValues = Object.entries(values).map(([key, value]) => {
        const item = parameters[Number(key)]
        if (item.type === BeginQueryType.Options) {
          return { ...item, value: resolveOptionValue(item, value) }
        }

        return { ...item, value }
      })

      ok(nextValues as BeginQuery[])
    },
    [formSchemaValues, ok, parameters],
  )

  return (
    <section className={className}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <section
            className={cn(
              'px-space-sm space-y-space-base pb-space-base overflow-auto',
              maxHeight,
            )}
          >
            {parameters.map((x, idx) => (
              <div key={idx}>{renderWidget(x, idx.toString())}</div>
            ))}
          </section>
          <div className="px-space-sm">
            <Button
              type="submit"
              disabled={loading || submitButtonDisabled}
              className="mt-space-xs w-full"
            >
              {loading
                ? t('common.loading', '加载中...')
                : btnText ||
                  t(
                    isNext ? 'common.next' : 'flow.run',
                    isNext ? '下一步' : '运行',
                  )}
            </Button>
          </div>
        </form>
      </Form>
    </section>
  )
}

export default DebugContent
