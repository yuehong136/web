import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Control } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { PdfGeneratorFormValues } from '../schema'

interface DocumentSettingsProps {
  control: Control<PdfGeneratorFormValues>
}

export function DocumentSettings({ control }: DocumentSettingsProps) {
  const { t } = useTranslation()

  return (
    <>
      <FormField
        control={control}
        name="output_format"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.outputFormat', 'Output Format')}</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? 'pdf'} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="content"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.content', 'Content')}</FormLabel>
            <FormControl>
              <Textarea rows={6} {...field} value={field.value ?? ''} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.title', 'Title')}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="subtitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.subtitle', 'Subtitle')}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="header_text"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.headerText', 'Header Text')}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="footer_text"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.footerText', 'Footer Text')}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  )
}
