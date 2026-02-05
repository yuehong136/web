import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

const settingFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  avatar: z.string().optional(),
})

export type SettingFormSchemaType = z.infer<typeof settingFormSchema>

interface SettingFormProps {
  submit: (values: SettingFormSchemaType) => void
  defaultValues?: Partial<SettingFormSchemaType>
}

export const AgentSettingId = 'agent-setting-form'

export function SettingForm({ submit, defaultValues }: SettingFormProps) {
  const { t } = useTranslation()

  const form = useForm<SettingFormSchemaType>({
    resolver: zodResolver(settingFormSchema),
    defaultValues: {
      name: '',
      description: '',
      avatar: '',
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form
        id={AgentSettingId}
        onSubmit={form.handleSubmit(submit)}
        className="space-y-space-base"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.name', '名称')}</FormLabel>
              <FormControl>
                <Input placeholder={t('common.namePlaceholder', '请输入名称')} {...field} />
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
              <FormLabel>{t('common.description', '描述')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('common.descriptionPlaceholder', '请输入描述')}
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
