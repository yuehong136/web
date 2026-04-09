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
import { orientationOptions, pageSizeOptions } from '../constants'
import type { PdfGeneratorFormValues } from '../schema'

interface PageLayoutSettingsProps {
  control: Control<PdfGeneratorFormValues>
}

export function PageLayoutSettings({ control }: PageLayoutSettingsProps) {
  const { t } = useTranslation()

  return (
    <>
      <FormField
        control={control}
        name="page_size"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.pageSize', 'Page Size')}</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((value) => (
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

      <FormField
        control={control}
        name="orientation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.orientation', 'Orientation')}</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {orientationOptions.map((value) => (
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
          name="margin_top"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.marginTop', 'Margin Top')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? 1}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="margin_bottom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.marginBottom', 'Margin Bottom')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? 1}
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
          name="margin_left"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.marginLeft', 'Margin Left')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? 1}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="margin_right"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.marginRight', 'Margin Right')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? 1}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="line_spacing"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.lineSpacing', 'Line Spacing')}</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                value={field.value ?? 1.2}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  )
}
