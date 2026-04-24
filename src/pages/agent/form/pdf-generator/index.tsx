import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { type Resolver, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { PromptEditor } from '@/components/prompt-editor'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { Switch } from '@/components/ui/switch'
import {
  PDFGeneratorFontFamily,
  PDFGeneratorLogoPosition,
  PDFGeneratorOrientation,
  PDFGeneratorPageSize,
  initialPDFGeneratorValues,
} from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output, transferOutputs } from '../components'

const pdfGeneratorSchema = z.object({
  output_format: z.string().default('pdf'),
  content: z.string().min(1, 'Content is required'),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  header_text: z.string().optional(),
  footer_text: z.string().optional(),
  logo_image: z.string().optional(),
  logo_position: z.string(),
  logo_width: z.number(),
  logo_height: z.number(),
  font_family: z.string(),
  font_size: z.number(),
  title_font_size: z.number(),
  heading1_font_size: z.number(),
  heading2_font_size: z.number(),
  heading3_font_size: z.number(),
  text_color: z.string(),
  title_color: z.string(),
  page_size: z.string(),
  orientation: z.string(),
  margin_top: z.number(),
  margin_bottom: z.number(),
  margin_left: z.number(),
  margin_right: z.number(),
  line_spacing: z.number(),
  filename: z.string().optional(),
  output_directory: z.string(),
  add_page_numbers: z.boolean(),
  add_timestamp: z.boolean(),
  watermark_text: z.string().optional(),
  enable_toc: z.boolean(),
  outputs: z.record(z.string(), z.unknown()).optional(),
})

type PdfGeneratorFormValues = z.infer<typeof pdfGeneratorSchema>

const outputFormatOptions = [
  { label: 'PDF', value: 'pdf' },
  { label: 'DOCX', value: 'docx' },
  { label: 'TXT', value: 'txt' },
]

function buildEnumOptions(values: string[]) {
  return values.map((value) => ({
    label: value,
    value,
  }))
}

const logoPositionOptions = buildEnumOptions(
  Object.values(PDFGeneratorLogoPosition),
)
const fontFamilyOptions = buildEnumOptions(
  Object.values(PDFGeneratorFontFamily),
)
const pageSizeOptions = buildEnumOptions(Object.values(PDFGeneratorPageSize))
const orientationOptions = buildEnumOptions(
  Object.values(PDFGeneratorOrientation),
)

export function PDFGeneratorForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialPDFGeneratorValues, node)

  const form = useForm<PdfGeneratorFormValues>({
    defaultValues: values as PdfGeneratorFormValues,
    resolver: zodResolver(pdfGeneratorSchema) as Resolver<PdfGeneratorFormValues>,
  })

  useWatchFormChange(node?.id, form)

  const formOutputs = form.watch('outputs')

  const outputList = useMemo(
    () => transferOutputs(formOutputs ?? values.outputs),
    [formOutputs, values.outputs],
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
                <SelectWithSearch
                  options={outputFormatOptions}
                  value={field.value ?? 'pdf'}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Choose the output document format.
              </FormDescription>
              <FormMessage />
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
                <PromptEditor
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  showToolbar
                  placeholder={
                    'Enter content with markdown formatting...\n\n**Bold text**, *italic*, # Heading, - List items, etc.'
                  }
                />
              </FormControl>
              <FormDescription>
                Markdown support: headings, lists, tables, code blocks, and
                inline formatting.
              </FormDescription>
              <FormMessage />
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
                <Input {...field} value={field.value ?? ''} placeholder="Document title (optional)" />
              </FormControl>
              <FormMessage />
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
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder="Document subtitle (optional)"
                />
              </FormControl>
              <FormMessage />
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
                <div className="space-y-space-sm">
                  <Input
                    type="file"
                    accept="image/*"
                    className="cursor-pointer"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (!file) {
                        return
                      }

                      const reader = new FileReader()
                      reader.onloadend = () => {
                        field.onChange(reader.result as string)
                      }
                      reader.readAsDataURL(file)
                    }}
                  />
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Or paste image path/URL/base64"
                  />
                </div>
              </FormControl>
              <FormDescription>
                Upload an image file or paste a file path, URL, or base64
                string.
              </FormDescription>
              <FormMessage />
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
                <SelectWithSearch
                  options={logoPositionOptions}
                  value={field.value ?? PDFGeneratorLogoPosition.Left}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-space-md">
          <FormField
            control={form.control}
            name="logo_width"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.logoWidth', 'Logo Width')} (inches)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.1"
                    value={field.value ?? 2}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="logo_height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.logoHeight', 'Logo Height')} (inches)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.1"
                    value={field.value ?? 1}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
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
                <SelectWithSearch
                  options={fontFamilyOptions}
                  value={field.value ?? PDFGeneratorFontFamily.Helvetica}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
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
                    {...field}
                    type="number"
                    value={field.value ?? 12}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
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
                    {...field}
                    type="number"
                    value={field.value ?? 24}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
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
                <SelectWithSearch
                  options={pageSizeOptions}
                  value={field.value ?? PDFGeneratorPageSize.A4}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
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
                <SelectWithSearch
                  options={orientationOptions}
                  value={field.value ?? PDFGeneratorOrientation.Portrait}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-space-md">
          <FormField
            control={form.control}
            name="margin_top"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.marginTop', 'Margin Top')} (inches)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.1"
                    value={field.value ?? 1}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="margin_bottom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.marginBottom', 'Margin Bottom')} (inches)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.1"
                    value={field.value ?? 1}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="filename"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.filename', 'Filename')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder="document.pdf (auto-generated if empty)"
                />
              </FormControl>
              <FormMessage />
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
                <Input
                  {...field}
                  value={field.value ?? '/tmp/pdf_outputs'}
                  placeholder="/tmp/pdf_outputs"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="add_page_numbers"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-radius-lg border border-border-default p-space-sm">
              <div className="space-y-space-xs">
                <FormLabel>{t('flow.addPageNumbers', 'Add Page Numbers')}</FormLabel>
                <FormDescription>
                  Add page numbers to the generated document.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
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
            <FormItem className="flex items-center justify-between rounded-radius-lg border border-border-default p-space-sm">
              <div className="space-y-space-xs">
                <FormLabel>{t('flow.addTimestamp', 'Add Timestamp')}</FormLabel>
                <FormDescription>
                  Add a generation timestamp to the document.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
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
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder="Watermark text (optional)"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="outputs"
          render={() => <div className="hidden" />}
        />

        <Output list={outputList} />
      </FormWrapper>
    </Form>
  )
}
