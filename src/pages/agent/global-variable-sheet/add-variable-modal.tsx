import { useCallback, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AgentGlobalVariable } from '@/types/agent'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Textarea } from '@/components/ui/textarea'
import {
  DEFAULT_GLOBAL_VARIABLE_FORM_VALUES,
  GLOBAL_VARIABLE_TYPE_OPTIONS,
  JSON_VALUE_TYPES,
} from './constants'
import {
  formatGlobalVariableFormValue,
  getDefaultValueForType,
  parseGlobalVariableValue,
  type GlobalVariableFormValues,
} from './utils'

const formId = 'global-variable-form'

interface AddVariableModalProps {
  visible: boolean
  hideModal: () => void
  onSubmit: (values: GlobalVariableFormValues) => Promise<void> | void
  defaultValues?: Partial<AgentGlobalVariable> | null
  loading?: boolean
}

export function AddVariableModal({
  visible,
  hideModal,
  onSubmit,
  defaultValues,
  loading,
}: AddVariableModalProps) {
  const { t } = useTranslation()
  const variableSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, t('flow.variableNameRequired', '变量名称不能为空'))
          .regex(
            /^[a-zA-Z_0-9]+$/,
            t('flow.variableNameMessage', '名称只能包含字母、数字和下划线'),
          ),
        type: z
          .string()
          .min(1, t('flow.variableTypeRequired', '变量类型不能为空')),
        value: z.string(),
        description: z.string().optional(),
      }),
    [t],
  )
  const form = useForm<GlobalVariableFormValues>({
    resolver: zodResolver(variableSchema),
    defaultValues: DEFAULT_GLOBAL_VARIABLE_FORM_VALUES,
    mode: 'onChange',
  })
  const type = form.watch('type')

  useEffect(() => {
    form.reset(formatGlobalVariableFormValue(defaultValues))
  }, [defaultValues, form])

  const handleTypeChange = useCallback(
    (nextType: string, onChange: (value: string) => void) => {
      onChange(nextType)
      form.setValue('value', getDefaultValueForType(nextType), {
        shouldDirty: true,
      })
    },
    [form],
  )

  const handleSubmit = useCallback(
    async (values: GlobalVariableFormValues) => {
      const normalizedValues = {
        ...values,
        name: values.name.trim(),
        description: values.description?.trim(),
      }

      try {
        parseGlobalVariableValue(normalizedValues.type, normalizedValues.value)
      } catch {
        form.setError('value', {
          message: t('flow.formatTypeError', 'Invalid value format'),
        })
        return
      }

      await onSubmit(normalizedValues)
    },
    [form, onSubmit, t],
  )

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && hideModal()}>
      <DialogContent size="md" className="overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {defaultValues
              ? t('flow.editVariable', '编辑变量')
              : t('flow.addVariable', '添加变量')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'flow.conversationVariableFormDescription',
              '配置 Agent 运行时可通过 env.* 引用的会话变量。',
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id={formId}
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex min-h-0 flex-col"
          >
            <div className="px-space-lg pb-space-lg min-h-0 overflow-y-auto">
              <div className="space-y-space-md">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>{t('common.name', '名称')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoComplete="off"
                          placeholder={t(
                            'flow.variableNamePlaceholder',
                            '例如 user_name',
                          )}
                          onBlur={(event) => {
                            field.onChange(event.target.value.trim())
                            field.onBlur()
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>{t('common.type', '类型')}</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          handleTypeChange(value, field.onChange)
                        }
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t('common.selectType', '选择类型')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GLOBAL_VARIABLE_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('flow.defaultValue', '默认值')}</FormLabel>
                      <FormControl>
                        {JSON_VALUE_TYPES.has(type) ? (
                          <Textarea
                            {...field}
                            className="font-mono"
                            placeholder={getDefaultValueForType(type)}
                            rows={5}
                          />
                        ) : (
                          <Input
                            {...field}
                            placeholder={getDefaultValueForType(type)}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('flow.description', 'Description')}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={t(
                            'flow.variableDescription',
                            '变量的描述',
                          )}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={hideModal}>
                {t('common.cancel', '取消')}
              </Button>
              <Button type="submit" loading={loading}>
                {t('common.confirm', '确认')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
