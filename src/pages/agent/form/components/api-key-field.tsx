import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'

interface IApiKeyFieldProps {
  placeholder?: string
}

export function ApiKeyField({ placeholder }: IApiKeyFieldProps) {
  const { t } = useTranslation()
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name="api_key"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('flow.apiKey', 'API Key')}</FormLabel>
          <FormControl>
            <Input type="password" {...field} placeholder={placeholder} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
