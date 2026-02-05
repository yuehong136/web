import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  PDFGeneratorFontFamily,
  PDFGeneratorLogoPosition,
  PDFGeneratorOrientation,
  PDFGeneratorPageSize,
  initialPDFGeneratorValues,
} from '../constant'
import { useFormValues } from '../hooks/use-form-values'
import { useWatchFormChange } from '../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../types'
import { FormWrapper, Output, transferOutputs } from './components'

const schema = z.object({
  output_format: z.string().optional(),
  content: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  header_text: z.string().optional(),
  footer_text: z.string().optional(),
  logo_image: z.string().optional(),
  logo_position: z.string().optional(),
  logo_width: z.coerce.number().optional(),
  logo_height: z.coerce.number().optional(),
  font_family: z.string().optional(),
  font_size: z.coerce.number().optional(),
  title_font_size: z.coerce.number().optional(),
  heading1_font_size: z.coerce.number().optional(),
  heading2_font_size: z.coerce.number().optional(),
  heading3_font_size: z.coerce.number().optional(),
  text_color: z.string().optional(),
  title_color: z.string().optional(),
  page_size: z.string().optional(),
  orientation: z.string().optional(),
  margin_top: z.coerce.number().optional(),
  margin_bottom: z.coerce.number().optional(),
  margin_left: z.coerce.number().optional(),
  margin_right: z.coerce.number().optional(),
  line_spacing: z.coerce.number().optional(),
  filename: z.string().optional(),
  output_directory: z.string().optional(),
  add_page_numbers: z.boolean().optional(),
  add_timestamp: z.boolean().optional(),
  watermark_text: z.string().optional(),
  enable_toc: z.boolean().optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export function PDFGeneratorForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialPDFGeneratorValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const outputs = form.getValues('outputs')

  const pageSizeOptions = useMemo(
    () => Object.values(PDFGeneratorPageSize),
    [],
  )
  const orientationOptions = useMemo(
    () => Object.values(PDFGeneratorOrientation),
    [],
  )
  const fontFamilyOptions = useMemo(
    () => Object.values(PDFGeneratorFontFamily),
    [],
  )
  const logoPositionOptions = useMemo(
    () => Object.values(PDFGeneratorLogoPosition),
    [],
  )

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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

        <FormField
          control={form.control}
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
          control={form.control}
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
            control={form.control}
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
            control={form.control}
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

        <FormField
          control={form.control}
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
            control={form.control}
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
            control={form.control}
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
            control={form.control}
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
            control={form.control}
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
            control={form.control}
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
            control={form.control}
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
            control={form.control}
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

        <FormField
          control={form.control}
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
          control={form.control}
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
            control={form.control}
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
            control={form.control}
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
            control={form.control}
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
            control={form.control}
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
          control={form.control}
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

        <FormField
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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

        {outputs && <Output list={transferOutputs(outputs)} />}
      </FormWrapper>
    </Form>
  )
}
