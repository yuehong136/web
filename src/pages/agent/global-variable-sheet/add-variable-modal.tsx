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
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

const variableTypeOptions = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Object', value: 'object' },
  { label: 'Array<String>', value: 'array<string>' },
  { label: 'Array<Number>', value: 'array<number>' },
  { label: 'Array<Object>', value: 'array<object>' },
]

const variableSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  value: z.any(),
})

type VariableFormValues = z.infer<typeof variableSchema>

interface AddVariableModalProps {
  visible: boolean
  hideModal: () => void
  onSubmit: (values: VariableFormValues) => void
  defaultValues?: Partial<VariableFormValues> | null
}

export function AddVariableModal({
  visible,
  hideModal,
  onSubmit,
  defaultValues,
}: AddVariableModalProps) {
  const { t } = useTranslation()

  const form = useForm<VariableFormValues>({
    resolver: zodResolver(variableSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      type: defaultValues?.type || 'string',
      value: defaultValues?.value || '',
    },
  })

  const handleSubmit = useCallback(
    (values: VariableFormValues) => {
      onSubmit(values)
      form.reset()
    },
    [form, onSubmit],
  )

  return (
    <Dialog open={visible} onOpenChange={hideModal}>
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('common.selectType', '选择类型')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {variableTypeOptions.map((option) => (
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
                    <Input
                      {...field}
                      value={typeof field.value === 'string' ? field.value : JSON.stringify(field.value)}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={hideModal}>
                {t('common.cancel', '取消')}
              </Button>
              <Button type="submit">{t('common.confirm', '确认')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
