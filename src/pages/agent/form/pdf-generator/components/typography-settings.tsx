import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Control } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { fontFamilyOptions } from '../constants'
import type { PdfGeneratorFormValues } from '../schema'

interface TypographySettingsProps {
  control: Control<PdfGeneratorFormValues>
}

export function TypographySettings({ control }: TypographySettingsProps) {
  const { t } = useTranslation()

  return (
    <>
      <FormField
        control={control}
        name="font_family"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.fontFamily', 'Font Family')}</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontFamilyOptions.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-space-md">
        <FormField
          control={control}
          name="font_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.fontSize', 'Font Size')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? 12}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="title_font_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.titleFontSize', 'Title Font Size')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? 24}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-3 gap-space-md">
        <FormField
          control={control}
          name="heading1_font_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>H1</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? 18}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="heading2_font_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>H2</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? 16}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="heading3_font_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>H3</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? 14}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-space-md">
        <FormField
          control={control}
          name="text_color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.textColor', 'Text Color')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="title_color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.titleColor', 'Title Color')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </>
  )
}
