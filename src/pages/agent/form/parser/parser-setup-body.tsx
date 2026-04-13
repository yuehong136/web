import { FormControl, FormField, FormItem } from '@/components/ui/form'
import { MultiSelectWithSearch } from '@/components/ui/multi-select-with-search'
import { useLLMGroupedOptionsByTypes } from '@/hooks/use-llm-request'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  getParserControlClassName,
  getParserFileTypeLabel,
  getParserOutputFormatLabel,
  getParserParseMethodLabel,
  getParserPreprocessLabel,
  parserAddableFileTypeOptions,
  parserPdfBuiltInParseMethodOptions,
  emailFieldOptions,
} from './constants'
import { ParserSetupAdvancedFields } from './parser-setup-advanced-fields'
import {
  ParserFieldLabel,
  ParserSelectField,
} from './parser-form-fields'
import {
  buildFlatOptions,
  buildModelOptions,
  ensureCurrentOption,
} from './parser-form-field.utils'
import type { ParserFormValues } from './schema'
import {
  ParserFileType,
  ParserParseMethod,
  getDefaultParserSetup,
  isParserMethodEqual,
  isParserMethodFromProvider,
  normalizeParserPreprocess,
  parserPreprocessOptionsMap,
  parserVisibleOutputFormatsMap,
  parserVisibleParseMethodsMap,
} from './utils'

type ParserSetupBodyProps = {
  index: number
  allFileFormats: string[]
}

function ParserBodySection({
  title,
  subtle = false,
  children,
}: {
  title: string
  subtle?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        'space-y-space-xl',
        subtle && 'rounded-radius-xl bg-background-subtle p-space-xl',
      )}
    >
      <div className="text-base font-semibold text-text-secondary">
        {title}
      </div>
      {children}
    </section>
  )
}

export function ParserSetupBody({
  index,
  allFileFormats,
}: ParserSetupBodyProps) {
  const { t } = useTranslation()
  const form = useFormContext<ParserFormValues>()
  const setup = useWatch({
    control: form.control,
    name: `setups.${index}`,
  })
  const { options: imageModelOptions, isLoading: isImageModelLoading } =
    useLLMGroupedOptionsByTypes(['image2text'], {
      valueMode: 'nameWithProvider',
    })
  const { options: speechModelOptions, isLoading: isSpeechModelLoading } =
    useLLMGroupedOptionsByTypes(['speech2text'], {
      valueMode: 'nameWithProvider',
    })
  const { options: ocrModelOptions, isLoading: isOCRModelLoading } =
    useLLMGroupedOptionsByTypes(['ocr'], {
      valueMode: 'nameWithProvider',
    })

  const fileFormat = setup?.fileFormat
  const parseMethod = setup?.parse_method
  const controlClassName = getParserControlClassName()
  const controlTriggerClassName = cn(
    'h-12 rounded-radius-xl border-border-default bg-surface-primary px-space-base py-space-sm text-base',
    controlClassName,
  )
  const defaultSetup = getDefaultParserSetup(fileFormat || '')
  const currentFileType = allFileFormats[index]
  const currentOutputFormat = setup?.output_format
  const currentLLMId = setup?.llm_id

  const selectedFileTypeOptions = useMemo(
    () =>
      parserAddableFileTypeOptions
        .filter((value) => value === currentFileType || !allFileFormats.includes(value))
        .map((value) => ({
          label: getParserFileTypeLabel(t, value),
          value,
        })),
    [allFileFormats, currentFileType, t],
  )

  const preprocessOptions = useMemo(
    () =>
      (parserPreprocessOptionsMap[fileFormat as keyof typeof parserPreprocessOptionsMap] || []).map(
        (value) => ({
          label: getParserPreprocessLabel(t, value),
          value,
        }),
      ),
    [fileFormat, t],
  )

  const outputOptions = useMemo(
    () =>
      ensureCurrentOption(
        buildFlatOptions(
          parserVisibleOutputFormatsMap[fileFormat as keyof typeof parserVisibleOutputFormatsMap] || [],
          getParserOutputFormatLabel,
        ),
        currentOutputFormat,
        getParserOutputFormatLabel(currentOutputFormat || ''),
      ),
    [currentOutputFormat, fileFormat],
  )

  const pdfOCRModelOptions = useMemo(
    () =>
      buildModelOptions(
        ocrModelOptions.filter(
          (group) =>
            group.providerName === 'MinerU' || group.providerName === 'PaddleOCR',
        ),
      ),
    [ocrModelOptions],
  )

  const parseMethodOptions = useMemo(() => {
    if (!fileFormat) {
      return []
    }

    if (fileFormat === ParserFileType.PDF) {
      return ensureCurrentOption(
        [
          ...parserPdfBuiltInParseMethodOptions,
          { label: 'MinerU', value: 'mineru' },
          { label: 'PaddleOCR', value: 'paddleocr' },
          ...pdfOCRModelOptions,
          ...buildModelOptions(imageModelOptions),
        ],
        parseMethod,
        getParserParseMethodLabel(parseMethod),
      )
    }

    if (fileFormat === ParserFileType.Image) {
      return ensureCurrentOption(
        [
          { label: 'OCR', value: ParserParseMethod.OCR },
          ...buildModelOptions(imageModelOptions),
        ],
        parseMethod,
        getParserParseMethodLabel(parseMethod),
      )
    }

    return ensureCurrentOption(
      buildFlatOptions(
        parserVisibleParseMethodsMap[fileFormat as keyof typeof parserVisibleParseMethodsMap] || [],
        getParserParseMethodLabel,
      ),
      parseMethod,
      getParserParseMethodLabel(parseMethod),
    )
  }, [fileFormat, imageModelOptions, parseMethod, pdfOCRModelOptions])

  const mediaModelOptions = useMemo(() => {
    if (fileFormat === ParserFileType.Audio) {
      return ensureCurrentOption(
        buildModelOptions(speechModelOptions),
        currentLLMId,
      )
    }

    if (fileFormat === ParserFileType.Video) {
      return ensureCurrentOption(
        buildModelOptions(imageModelOptions),
        currentLLMId,
      )
    }

    return []
  }, [currentLLMId, fileFormat, imageModelOptions, speechModelOptions])

  const showParseMethodField = parseMethodOptions.length > 0
  const showPreprocessField = preprocessOptions.length > 0
  const showTCADPOptions =
    (fileFormat === ParserFileType.PDF ||
      fileFormat === ParserFileType.Spreadsheet ||
      fileFormat === ParserFileType.Slides) &&
    isParserMethodEqual(parseMethod, ParserParseMethod.TCADPParser)
  const showMineruOptions =
    fileFormat === ParserFileType.PDF &&
    (isParserMethodEqual(parseMethod, 'mineru') ||
      isParserMethodFromProvider(parseMethod, 'MinerU'))
  const showPaddleOCROptions =
    fileFormat === ParserFileType.PDF &&
    (isParserMethodEqual(parseMethod, 'paddleocr') ||
      isParserMethodFromProvider(parseMethod, 'PaddleOCR'))
  const showPdfLanguageField =
    fileFormat === ParserFileType.PDF &&
    !!parseMethod &&
    !isParserMethodEqual(parseMethod, ParserParseMethod.DeepDOC) &&
    !isParserMethodEqual(parseMethod, ParserParseMethod.PlainText) &&
    !isParserMethodEqual(parseMethod, ParserParseMethod.TCADPParser) &&
    !showMineruOptions &&
    !showPaddleOCROptions
  const showImageVisualFields =
    fileFormat === ParserFileType.Image &&
    !!parseMethod &&
    !isParserMethodEqual(parseMethod, ParserParseMethod.OCR)
  const modelEmptyText =
    isImageModelLoading || isSpeechModelLoading || isOCRModelLoading
      ? t('common.loading', 'Loading...')
      : t('flow.noModels', 'No models available')

  const showAdvancedSection =
    showTCADPOptions ||
    showMineruOptions ||
    showPaddleOCROptions ||
    (fileFormat === ParserFileType.PDF &&
      isParserMethodEqual(parseMethod, ParserParseMethod.Docling)) ||
    showImageVisualFields ||
    fileFormat === ParserFileType.Video

  return (
    <div className="space-y-space-xl">
      <ParserBodySection title={t('flow.basic', 'Basic')}>
        <ParserSelectField
          control={form.control}
          name={`setups.${index}.fileFormat`}
          label={t('flow.fileFormat', 'File Format')}
          options={selectedFileTypeOptions}
          value={fileFormat}
          onValueChange={(value) => {
            form.setValue(`setups.${index}`, getDefaultParserSetup(value), {
              shouldDirty: true,
              shouldValidate: true,
            })
          }}
          triggerClassName={controlTriggerClassName}
        />

        <div className="grid gap-space-xl md:grid-cols-2">
          <ParserSelectField
            control={form.control}
            name={`setups.${index}.output_format`}
            label={t('flow.outputFormat', 'Output format')}
            options={outputOptions}
            value={currentOutputFormat}
            triggerClassName={controlTriggerClassName}
          />

          {showParseMethodField ? (
            <ParserSelectField
              control={form.control}
              name={`setups.${index}.parse_method`}
              label={t('flow.parserMethod', 'Parse method')}
              options={parseMethodOptions}
              value={parseMethod}
              onValueChange={(value) => {
                if (
                  (fileFormat === ParserFileType.PDF ||
                    fileFormat === ParserFileType.Spreadsheet ||
                    fileFormat === ParserFileType.Slides) &&
                  isParserMethodEqual(value, ParserParseMethod.TCADPParser)
                ) {
                  form.setValue(
                    `setups.${index}.table_result_type`,
                    setup?.table_result_type || defaultSetup.table_result_type || '1',
                    { shouldDirty: true },
                  )
                  form.setValue(
                    `setups.${index}.markdown_image_response_type`,
                    setup?.markdown_image_response_type ||
                      defaultSetup.markdown_image_response_type ||
                      '1',
                    { shouldDirty: true },
                  )
                }

                if (
                  fileFormat === ParserFileType.PDF &&
                  (isParserMethodEqual(value, 'mineru') ||
                    isParserMethodFromProvider(value, 'MinerU'))
                ) {
                  form.setValue(
                    `setups.${index}.mineru_parse_method`,
                    setup?.mineru_parse_method ||
                      defaultSetup.mineru_parse_method ||
                      'auto',
                    { shouldDirty: true },
                  )
                  form.setValue(
                    `setups.${index}.mineru_formula_enable`,
                    setup?.mineru_formula_enable ??
                      defaultSetup.mineru_formula_enable ??
                      true,
                    { shouldDirty: true },
                  )
                  form.setValue(
                    `setups.${index}.mineru_table_enable`,
                    setup?.mineru_table_enable ??
                      defaultSetup.mineru_table_enable ??
                      true,
                    { shouldDirty: true },
                  )
                  form.setValue(
                    `setups.${index}.mineru_lang`,
                    setup?.mineru_lang || defaultSetup.mineru_lang || 'English',
                    { shouldDirty: true },
                  )
                }

                if (
                  fileFormat === ParserFileType.PDF &&
                  (isParserMethodEqual(value, 'paddleocr') ||
                    isParserMethodFromProvider(value, 'PaddleOCR'))
                ) {
                  form.setValue(
                    `setups.${index}.paddleocr_parse_method`,
                    setup?.paddleocr_parse_method ||
                      defaultSetup.paddleocr_parse_method ||
                      'raw',
                    { shouldDirty: true },
                  )
                }

                if (
                  fileFormat === ParserFileType.PDF &&
                  isParserMethodEqual(value, ParserParseMethod.Docling)
                ) {
                  form.setValue(
                    `setups.${index}.docling_parse_method`,
                    setup?.docling_parse_method ||
                      defaultSetup.docling_parse_method ||
                      'raw',
                    { shouldDirty: true },
                  )
                }
              }}
              emptyText={modelEmptyText}
              triggerClassName={controlTriggerClassName}
            />
          ) : null}
        </div>

        {showPreprocessField ? (
          <FormField
            control={form.control}
            name={`setups.${index}.preprocess`}
            render={({ field }) => (
              <FormItem className="space-y-space-md">
                <ParserFieldLabel>
                  {t('flow.preprocess.preprocess', 'Preprocess')}
                </ParserFieldLabel>
                <FormControl>
                  <MultiSelectWithSearch
                    options={preprocessOptions}
                    value={field.value || []}
                    onChange={(value) =>
                      field.onChange(normalizeParserPreprocess(fileFormat, value))
                    }
                    triggerClassName={controlTriggerClassName}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        ) : null}

        {(fileFormat === ParserFileType.Audio ||
          fileFormat === ParserFileType.Video) &&
        mediaModelOptions.length > 0 ? (
          <ParserSelectField
            control={form.control}
            name={`setups.${index}.llm_id`}
            label={t('flow.model', 'Model')}
            options={mediaModelOptions}
            value={currentLLMId}
            placeholder={t('flow.selectModel', 'Select model')}
            emptyText={modelEmptyText}
            triggerClassName={controlTriggerClassName}
          />
        ) : null}

        {fileFormat === ParserFileType.Email ? (
          <FormField
            control={form.control}
            name={`setups.${index}.fields`}
            render={({ field }) => (
              <FormItem className="space-y-space-md">
                <ParserFieldLabel>{t('flow.fields', 'Fields')}</ParserFieldLabel>
                <FormControl>
                  <MultiSelectWithSearch
                    options={emailFieldOptions}
                    value={field.value || []}
                    onChange={field.onChange}
                    triggerClassName={controlTriggerClassName}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        ) : null}
      </ParserBodySection>

      {showAdvancedSection ? (
        <ParserBodySection
          title={t('flow.advanced', 'Advanced')}
          subtle
        >
          <ParserSetupAdvancedFields
            index={index}
            fileFormat={fileFormat}
            parseMethod={parseMethod}
            setup={setup}
            controlTriggerClassName={controlTriggerClassName}
            showPdfLanguageField={showPdfLanguageField}
            showTCADPOptions={showTCADPOptions}
            showMineruOptions={showMineruOptions}
            showPaddleOCROptions={showPaddleOCROptions}
            showImageVisualFields={showImageVisualFields}
          />
        </ParserBodySection>
      ) : null}
    </div>
  )
}
