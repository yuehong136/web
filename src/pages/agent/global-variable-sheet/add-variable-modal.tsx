import { useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AgentGlobalVariable } from '@/types/agent'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
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

const variableSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .regex(/^[a-zA-Z_0-9]+$/, 'Only letters, numbers and underscores are allowed'),
  type: z.string().min(1, 'Type is required'),
  value: z.string(),
  description: z.string().optional(),
})

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
  const form = useForm<GlobalVariableFormValues>({
    resolver: zodResolver(variableSchema),
    defaultValues: DEFAULT_GLOBAL_VARIABLE_FORM_VALUES,
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
      try {
        parseGlobalVariableValue(values.type, values.value)
      } catch {
        form.setError('value', {
          message: t('flow.formatTypeError', 'Invalid value format'),
        })
        return
      }

      await onSubmit(values)
    },
    [form, onSubmit, t],
  )

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && hideModal()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {defaultValues
              ? t('flow.editVariable', '编辑变量')
              : t('flow.addVariable', '添加变量')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-space-base"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.name', '名称')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>{t('common.type', '类型')}</FormLabel>
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
                  <FormLabel>{t('common.defaultValue', '默认值')}</FormLabel>
                  <FormControl>
                    {JSON_VALUE_TYPES.has(type) ? (
                      <Textarea {...field} className="min-h-32 font-mono" />
                    ) : (
                      <Input {...field} />
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
                  <FormLabel>{t('flow.description', 'Description')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-24" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={hideModal}>
                {t('common.cancel', '取消')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('common.saving', '保存中...') : t('common.confirm', '确认')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
