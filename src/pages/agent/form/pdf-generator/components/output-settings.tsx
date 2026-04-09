import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { Control } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { PdfGeneratorFormValues } from '../schema'

interface OutputSettingsProps {
  control: Control<PdfGeneratorFormValues>
}

export function OutputSettings({ control }: OutputSettingsProps) {
  const { t } = useTranslation()

  return (
    <>
      <FormField
        control={control}
        name="filename"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.filename', 'Filename')}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="output_directory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.outputDirectory', 'Output Directory')}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="add_page_numbers"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between">
            <FormLabel>{t('flow.addPageNumbers', 'Page Numbers')}</FormLabel>
            <FormControl>
              <Switch
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="add_timestamp"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between">
            <FormLabel>{t('flow.addTimestamp', 'Timestamp')}</FormLabel>
            <FormControl>
              <Switch
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="watermark_text"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.watermarkText', 'Watermark Text')}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="enable_toc"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between">
            <FormLabel>{t('flow.enableToc', 'Enable TOC')}</FormLabel>
            <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  )
}
