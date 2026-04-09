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
import { logoPositionOptions } from '../constants'
import type { PdfGeneratorFormValues } from '../schema'

interface LogoSettingsProps {
  control: Control<PdfGeneratorFormValues>
}

export function LogoSettings({ control }: LogoSettingsProps) {
  const { t } = useTranslation()

  return (
    <>
      <FormField
        control={control}
        name="logo_image"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.logoImage', 'Logo Image')}</FormLabel>
            <FormControl>
              <Input {...field} placeholder="https://..." />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="logo_position"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.logoPosition', 'Logo Position')}</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {logoPositionOptions.map((value) => (
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
          name="logo_width"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.logoWidth', 'Logo Width')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? 2}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="logo_height"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.logoHeight', 'Logo Height')}</FormLabel>
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
    </>
  )
}
