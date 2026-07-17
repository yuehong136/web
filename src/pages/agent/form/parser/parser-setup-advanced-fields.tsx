import { PromptEditor } from '@/components/prompt-editor'
import { FormControl, FormField, FormItem } from '@/components/ui/form'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  parserDoclingParseMethodOptions,
  parserLanguageOptions,
  parserMarkdownImageResponseTypeOptions,
  parserMineruParseMethodOptions,
  parserPaddleOCRParseMethodOptions,
  parserTableResultTypeOptions,
} from './constants'
import {
  ParserFieldLabel,
  ParserSelectField,
  ParserSwitchField,
} from './parser-form-fields'
import { ensureCurrentOption } from './parser-form-field.utils'
import type { ParserSetupFormValue, ParserFormValues } from './schema'
import { ParserFileType, ParserParseMethod, isParserMethodEqual } from './utils'

type ParserSetupAdvancedFieldsProps = {
  index: number
  fileFormat?: string
  parseMethod?: string
  setup?: ParserSetupFormValue
  controlTriggerClassName: string
  showPdfLanguageField: boolean
  showTCADPOptions: boolean
  showMineruOptions: boolean
  showPaddleOCROptions: boolean
  showImageVisualFields: boolean
  showMediaFlattening: boolean
}

export function ParserSetupAdvancedFields({
  index,
  fileFormat,
  parseMethod,
  setup,
  controlTriggerClassName,
  showPdfLanguageField,
  showTCADPOptions,
  showMineruOptions,
  showPaddleOCROptions,
  showImageVisualFields,
  showMediaFlattening,
}: ParserSetupAdvancedFieldsProps) {
  const { t } = useTranslation()
  const form = useFormContext<ParserFormValues>()

  return (
    <>
      {showMediaFlattening ? (
        <ParserSwitchField
          control={form.control}
          name={`setups.${index}.flatten_media_to_text`}
          label={t('flow.flattenMediaToText', 'Treat media as text')}
          description={t(
            'flow.flattenMediaToTextTip',
            'Classify detected images and tables as text and skip vision-model enrichment.',
          )}
        />
      ) : null}

      {showPdfLanguageField ? (
        <ParserSelectField
          control={form.control}
          name={`setups.${index}.lang`}
          label={t('flow.lang', 'Language')}
          options={ensureCurrentOption(
            parserLanguageOptions,
            setup?.lang,
            setup?.lang,
          )}
          value={setup?.lang}
          triggerClassName={controlTriggerClassName}
        />
      ) : null}

      {showTCADPOptions ? (
        <div className="gap-space-xl grid md:grid-cols-2">
          <ParserSelectField
            control={form.control}
            name={`setups.${index}.table_result_type`}
            label={t('flow.tableResultType', 'Table result type')}
            options={ensureCurrentOption(
              parserTableResultTypeOptions,
              setup?.table_result_type,
              setup?.table_result_type,
            )}
            value={setup?.table_result_type}
            triggerClassName={controlTriggerClassName}
          />
          <ParserSelectField
            control={form.control}
            name={`setups.${index}.markdown_image_response_type`}
            label={t(
              'flow.markdownImageResponseType',
              'Markdown image response type',
            )}
            options={ensureCurrentOption(
              parserMarkdownImageResponseTypeOptions,
              setup?.markdown_image_response_type,
              setup?.markdown_image_response_type,
            )}
            value={setup?.markdown_image_response_type}
            triggerClassName={controlTriggerClassName}
          />
        </div>
      ) : null}

      {showMineruOptions ? (
        <>
          <div className="text-base font-semibold text-text-secondary">
            MinerU
          </div>
          <div className="gap-space-xl grid md:grid-cols-2">
            <ParserSelectField
              control={form.control}
              name={`setups.${index}.mineru_parse_method`}
              label={t('flow.mineruParseMethod', 'MinerU parse method')}
              options={ensureCurrentOption(
                parserMineruParseMethodOptions,
                setup?.mineru_parse_method,
                setup?.mineru_parse_method,
              )}
              value={setup?.mineru_parse_method}
              triggerClassName={controlTriggerClassName}
            />
            <ParserSelectField
              control={form.control}
              name={`setups.${index}.mineru_lang`}
              label={t('flow.mineruLanguage', 'MinerU language')}
              options={ensureCurrentOption(
                parserLanguageOptions,
                setup?.mineru_lang,
                setup?.mineru_lang,
              )}
              value={setup?.mineru_lang}
              triggerClassName={controlTriggerClassName}
            />
          </div>
          <div className="gap-space-xl grid md:grid-cols-2">
            <ParserSwitchField
              control={form.control}
              name={`setups.${index}.mineru_formula_enable`}
              label={t('flow.mineruFormulaEnable', 'Formula recognition')}
            />
            <ParserSwitchField
              control={form.control}
              name={`setups.${index}.mineru_table_enable`}
              label={t('flow.mineruTableEnable', 'Table recognition')}
            />
          </div>
        </>
      ) : null}

      {showPaddleOCROptions ? (
        <ParserSelectField
          control={form.control}
          name={`setups.${index}.paddleocr_parse_method`}
          label={t('flow.paddleocrParseMethod', 'PaddleOCR parse method')}
          options={ensureCurrentOption(
            parserPaddleOCRParseMethodOptions,
            setup?.paddleocr_parse_method,
            setup?.paddleocr_parse_method,
          )}
          value={setup?.paddleocr_parse_method}
          triggerClassName={controlTriggerClassName}
        />
      ) : null}

      {fileFormat === ParserFileType.PDF &&
      isParserMethodEqual(parseMethod, ParserParseMethod.Docling) ? (
        <ParserSelectField
          control={form.control}
          name={`setups.${index}.docling_parse_method`}
          label={t('flow.doclingParseMethod', 'Docling parse method')}
          options={ensureCurrentOption(
            parserDoclingParseMethodOptions,
            setup?.docling_parse_method,
            setup?.docling_parse_method,
          )}
          value={setup?.docling_parse_method}
          triggerClassName={controlTriggerClassName}
        />
      ) : null}

      {showImageVisualFields ? (
        <div className="gap-space-xl grid md:grid-cols-2">
          <ParserSelectField
            control={form.control}
            name={`setups.${index}.lang`}
            label={t('flow.lang', 'Language')}
            options={ensureCurrentOption(
              parserLanguageOptions,
              setup?.lang,
              setup?.lang,
            )}
            value={setup?.lang}
            triggerClassName={controlTriggerClassName}
          />
        </div>
      ) : null}

      {showImageVisualFields ? (
        <FormField
          control={form.control}
          name={`setups.${index}.system_prompt`}
          render={({ field }) => (
            <FormItem className="space-y-space-md">
              <ParserFieldLabel>
                {t('flow.systemPrompt', 'System prompt')}
              </ParserFieldLabel>
              <FormControl>
                <PromptEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                  showToolbar={false}
                  placeholder={t(
                    'flow.systemPromptPlaceholder',
                    'Enter a system prompt for image analysis. Leave empty to use the default prompt.',
                  )}
                />
              </FormControl>
            </FormItem>
          )}
        />
      ) : null}

      {fileFormat === ParserFileType.Video ? (
        <FormField
          control={form.control}
          name={`setups.${index}.prompt`}
          render={({ field }) => (
            <FormItem className="space-y-space-md">
              <ParserFieldLabel>
                {t('flow.promptWorkspace', 'Prompt workspace')}
              </ParserFieldLabel>
              <FormControl>
                <PromptEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                  showToolbar={false}
                  placeholder={t(
                    'flow.insertVariableTip',
                    'Type / to browse upstream variables',
                  )}
                />
              </FormControl>
            </FormItem>
          )}
        />
      ) : null}
    </>
  )
}
