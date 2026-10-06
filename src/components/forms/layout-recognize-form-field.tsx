import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'
import { AlertTriangle, ExternalLink, LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants'
import { IconMap, parseLLMValue } from '@/stores/model'
import { usePDFParserOptions } from '@/hooks/use-pdf-parser-options'
import type { PDFParserOption } from '@/lib/knowledge/pdf-parser-options'
import { Button } from '@/components/ui/button'
import { ProviderIcon } from '@/components/ui/provider-icon'
import {
  SelectWithSearch,
  type SelectOptionGroup,
} from '@/components/ui/select-with-search'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

interface LayoutRecognizeFormFieldProps {
  name?: string
  horizontal?: boolean
  className?: string
  // Kept for existing Agent callers; ancillary OCR fields are rendered by consumers.
  showMineruOptions?: boolean
  showPaddleocrOptions?: boolean
}

export function LayoutRecognizeFormField({
  name = 'parser_config.layout_recognize',
  horizontal = true,
  className,
}: LayoutRecognizeFormFieldProps) {
  const { t } = useTranslation()
  const form = useFormContext()
  const { options, isLoading, isError, refetch } = usePDFParserOptions()
  const modelCount = options.filter(
    (option) => option.kind !== 'builtin',
  ).length
  const label = (option: PDFParserOption) =>
    option.kind === 'builtin' ? (
      option.value === 'Plain Text' ? (
        t('knowledge.settings.options.layoutParser.plainText')
      ) : (
        option.label
      )
    ) : (
      <span className="flex min-w-0 items-center justify-between gap-space-sm">
        <span aria-hidden="true" className="shrink-0">
          <ProviderIcon
            provider={option.provider ?? ''}
            className="size-icon-md"
            size={20}
          />
        </span>
        <span className="min-w-0 flex-1 truncate">
          {option.provider} / {option.label}
        </span>
        <span className="shrink-0 text-xs text-status-warning">
          {t('knowledge.settings.pdfParser.experimental')}
        </span>
      </span>
    )
  const groups: SelectOptionGroup[] = (['builtin', 'ocr', 'vision'] as const)
    .map((kind) => ({
      label: t(`knowledge.settings.pdfParser.groups.${kind}`),
      options: options
        .filter((option) => option.kind === kind)
        .map((option) => ({ value: option.value, label: label(option) })),
    }))
    .filter((group) => group.options.length > 0)

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const savedOnly =
          !!field.value &&
          !options.some((option) => option.value === field.value)
        const savedProvider = savedOnly
          ? (parseLLMValue(field.value).providerName ??
            (Object.hasOwn(IconMap, field.value) ? field.value : null))
          : null
        const savedLabel = (
          <span className="flex min-w-0 items-center gap-space-sm">
            {savedProvider && (
              <span aria-hidden="true" className="shrink-0">
                <ProviderIcon
                  provider={savedProvider}
                  className="size-icon-md"
                  size={20}
                />
              </span>
            )}
            <span className="truncate">{field.value}</span>
          </span>
        )
        const choices = savedOnly
          ? [
              ...groups,
              {
                label: t('knowledge.settings.pdfParser.savedGroup'),
                options: [
                  { value: field.value, label: savedLabel, disabled: true },
                ],
              },
            ]
          : groups
        return (
          <FormItem className={cn('space-y-space-sm', className)}>
            <div
              className={cn(
                'flex gap-space-sm',
                horizontal ? 'items-start' : 'flex-col',
              )}
            >
              <FormLabel
                tooltip={t('knowledge.settings.fields.layoutParserTooltip')}
                className={cn(
                  'text-sm text-text-secondary',
                  horizontal && 'w-1/4 shrink-0 pt-space-sm',
                )}
              >
                {t('knowledge.settings.fields.layoutParser')}
              </FormLabel>
              <div
                className={cn(
                  'min-w-0 space-y-space-sm',
                  horizontal ? 'w-3/4' : 'w-full',
                )}
              >
                <FormControl>
                  <SelectWithSearch
                    value={field.value}
                    onChange={field.onChange}
                    options={choices}
                    ariaLabel={t('knowledge.settings.fields.layoutParser')}
                    placeholder={t(
                      'knowledge.settings.fields.layoutParserPlaceholder',
                    )}
                    searchPlaceholder={t('knowledge.settings.pdfParser.search')}
                    emptyText={t('knowledge.settings.pdfParser.noMatches')}
                  />
                </FormControl>
                <div
                  aria-live="polite"
                  aria-busy={isLoading}
                  className="space-y-space-xs text-xs text-text-secondary"
                >
                  {isLoading ? (
                    <p className="flex items-center gap-space-xs">
                      <LoaderCircle
                        aria-hidden="true"
                        className="size-icon-sm animate-spin"
                      />
                      {t('knowledge.settings.pdfParser.loading')}
                    </p>
                  ) : isError ? (
                    <div className="flex items-center gap-space-sm text-status-warning">
                      <AlertTriangle
                        aria-hidden="true"
                        className="size-icon-sm shrink-0"
                      />
                      <span>{t('knowledge.settings.pdfParser.loadError')}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void refetch()}
                      >
                        {t('knowledge.settings.pdfParser.retry')}
                      </Button>
                    </div>
                  ) : modelCount === 0 ? (
                    <p>{t('knowledge.settings.pdfParser.empty')}</p>
                  ) : null}
                  {savedOnly && !isLoading && (
                    <p className="flex items-start gap-space-xs text-status-warning">
                      <AlertTriangle
                        aria-hidden="true"
                        className="size-icon-sm shrink-0"
                      />
                      {t(
                        isError
                          ? 'knowledge.settings.pdfParser.savedUnverified'
                          : 'knowledge.settings.pdfParser.savedUnavailable',
                      )}
                    </p>
                  )}
                  <p>{t('knowledge.settings.pdfParser.scope')}</p>
                  <p>{t('knowledge.settings.pdfParser.costHint')}</p>
                </div>
                <Button
                  asChild
                  type="button"
                  size="sm"
                  variant="link"
                  className="h-auto px-0"
                >
                  <a
                    href={ROUTES.SETTINGS_MODEL_PROVIDERS}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('knowledge.settings.pdfParser.configure')}
                    <ExternalLink aria-hidden="true" className="size-icon-sm" />
                  </a>
                </Button>
                <FormMessage />
              </div>
            </div>
          </FormItem>
        )
      }}
    />
  )
}
