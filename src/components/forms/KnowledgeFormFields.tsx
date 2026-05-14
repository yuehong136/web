'use client'

import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  SelectWithSearch,
  type SelectOptionGroup,
} from '@/components/ui/select-with-search'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { SliderInputFormField } from './SliderInputFormField'
import {
  LayoutRecognizeOptions,
  PermissionOptions,
  MineruParseMethodOptions,
  MineruLanguageOptions,
} from '@/types/knowledge-form'

// =====================================================
// 布局识别/PDF解析器选择
// =====================================================
interface LayoutRecognizeFormFieldProps {
  name?: string
  horizontal?: boolean
  className?: string
  showMineruOptions?: boolean
  showPaddleocrOptions?: boolean
}

export function LayoutRecognizeFormField({
  name = 'parser_config.layout_recognize',
  horizontal = true,
  className,
  showMineruOptions: _showMineruOptions = true,
  showPaddleocrOptions: _showPaddleocrOptions = true,
}: LayoutRecognizeFormFieldProps) {
  const { t } = useTranslation()
  const form = useFormContext()

  const options: SelectOptionGroup[] = LayoutRecognizeOptions.map((opt) => ({
    label:
      opt.value === 'Plain Text'
        ? t('knowledge.settings.options.layoutParser.plainText')
        : opt.label,
    value: opt.value,
  }))

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            horizontal && 'flex items-center gap-1 space-y-0',
            className,
          )}
        >
          <FormLabel
            tooltip={t('knowledge.settings.fields.layoutParserTooltip')}
            className={cn(
              'text-sm text-text-secondary',
              horizontal && 'w-1/4 shrink-0',
            )}
          >
            {t('knowledge.settings.fields.layoutParser')}
          </FormLabel>
          <div className={horizontal ? 'w-3/4' : 'w-full'}>
            <FormControl>
              <SelectWithSearch
                value={field.value}
                onChange={field.onChange}
                options={options}
                placeholder={t(
                  'knowledge.settings.fields.layoutParserPlaceholder',
                )}
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// =====================================================
// 最大Token数量
// =====================================================
interface MaxTokenNumberFormFieldProps {
  name?: string
  initialValue?: number
  max?: number
  className?: string
}

export function MaxTokenNumberFormField({
  name = 'parser_config.chunk_token_num',
  initialValue = 512,
  max = 2048,
  className,
}: MaxTokenNumberFormFieldProps) {
  const { t } = useTranslation()

  return (
    <SliderInputFormField
      name={name}
      label={t('knowledge.settings.fields.maxToken')}
      tooltip={t('knowledge.settings.fields.maxTokenTooltip')}
      min={0}
      max={max}
      step={1}
      defaultValue={initialValue}
      layout="horizontal"
      className={className}
    />
  )
}

// =====================================================
// 分隔符输入
// =====================================================
interface DelimiterFormFieldProps {
  name?: string
  className?: string
}

export function DelimiterFormField({
  name = 'parser_config.delimiter',
  className,
}: DelimiterFormFieldProps) {
  const { t } = useTranslation()
  const form = useFormContext()

  // 处理特殊字符的显示转换
  const formatValue = (value: string | undefined) => {
    if (!value) return ''
    return value
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t')
      .replace(/\r/g, '\\r')
  }

  const parseValue = (input: string) => {
    return input
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
  }

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn('flex items-center gap-1 space-y-0', className)}
        >
          <FormLabel
            required
            tooltip={t('knowledge.settings.fields.delimiterTooltip')}
            className="w-1/4 shrink-0 text-sm text-text-secondary"
          >
            {t('knowledge.settings.fields.delimiter')}
          </FormLabel>
          <div className="w-3/4">
            <FormControl>
              <Input
                value={formatValue(field.value)}
                onChange={(e) => field.onChange(parseValue(e.target.value))}
                placeholder="\n"
                className="h-9"
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// =====================================================
// 自动关键词提取
// =====================================================
interface AutoKeywordsFormFieldProps {
  name?: string
  className?: string
}

export function AutoKeywordsFormField({
  name = 'parser_config.auto_keywords',
  className,
}: AutoKeywordsFormFieldProps) {
  const { t } = useTranslation()

  return (
    <SliderInputFormField
      name={name}
      label={t('knowledge.settings.fields.autoKeywords')}
      tooltip={t('knowledge.settings.fields.autoKeywordsTooltip')}
      min={0}
      max={30}
      step={1}
      defaultValue={0}
      layout="horizontal"
      className={className}
    />
  )
}

// =====================================================
// 自动问题提取
// =====================================================
interface AutoQuestionsFormFieldProps {
  name?: string
  className?: string
}

export function AutoQuestionsFormField({
  name = 'parser_config.auto_questions',
  className,
}: AutoQuestionsFormFieldProps) {
  const { t } = useTranslation()

  return (
    <SliderInputFormField
      name={name}
      label={t('knowledge.settings.fields.autoQuestions')}
      tooltip={t('knowledge.settings.fields.autoQuestionsTooltip')}
      min={0}
      max={10}
      step={1}
      defaultValue={0}
      layout="horizontal"
      className={className}
    />
  )
}

// =====================================================
// Excel 转 HTML
// =====================================================
interface ExcelToHtmlFormFieldProps {
  name?: string
  className?: string
}

export function ExcelToHtmlFormField({
  name = 'parser_config.html4excel',
  className,
}: ExcelToHtmlFormFieldProps) {
  const { t } = useTranslation()
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn('flex items-center gap-1 space-y-0', className)}
        >
          <FormLabel
            tooltip={t('knowledge.settings.fields.html4excelTooltip')}
            className="w-1/4 shrink-0 text-sm text-text-secondary"
          >
            {t('knowledge.settings.fields.html4excel')}
          </FormLabel>
          <div className="w-3/4">
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// =====================================================
// TOC 提取开关
// =====================================================
interface TocExtractionFormFieldProps {
  name?: string
  className?: string
}

export function TocExtractionFormField({
  name = 'parser_config.toc_extraction',
  className,
}: TocExtractionFormFieldProps) {
  const { t } = useTranslation()
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn('flex items-center gap-1 space-y-0', className)}
        >
          <FormLabel
            tooltip={t('knowledge.settings.fields.tocExtractionTooltip')}
            className="w-1/4 shrink-0 text-sm text-text-secondary"
          >
            {t('knowledge.settings.fields.tocExtraction')}
          </FormLabel>
          <div className="w-3/4">
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// =====================================================
// 图像与表格上下文窗口
// =====================================================
interface ImageTableContextWindowFormFieldProps {
  name?: string
  className?: string
}

export function ImageTableContextWindowFormField({
  name = 'parser_config.image_table_context_window',
  className,
}: ImageTableContextWindowFormFieldProps) {
  const { t } = useTranslation()

  return (
    <SliderInputFormField
      name={name}
      label={t('knowledge.settings.fields.imageTableContext')}
      tooltip={t('knowledge.settings.fields.imageTableContextTooltip')}
      min={0}
      max={256}
      step={1}
      defaultValue={0}
      layout="horizontal"
      className={className}
    />
  )
}

// =====================================================
// PageRank 权重
// =====================================================
interface PageRankFormFieldProps {
  name?: string
  className?: string
}

export function PageRankFormField({
  name = 'pagerank',
  className,
}: PageRankFormFieldProps) {
  const { t } = useTranslation()

  return (
    <SliderInputFormField
      name={name}
      label={t('knowledge.settings.fields.pageRank')}
      tooltip={t('knowledge.settings.fields.pageRankTooltip')}
      min={0}
      max={100}
      step={1}
      defaultValue={0}
      layout="horizontal"
      className={className}
    />
  )
}

// =====================================================
// 权限选择
// =====================================================
interface PermissionFormFieldProps {
  name?: string
  className?: string
}

export function PermissionFormField({
  name = 'permission',
  className,
}: PermissionFormFieldProps) {
  const { t } = useTranslation()
  const form = useFormContext()

  const options: SelectOptionGroup[] = PermissionOptions.map((opt) => ({
    label: t(`knowledge.settings.options.permission.${opt.value}`),
    value: opt.value,
  }))

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn('flex items-center gap-1 space-y-0', className)}
        >
          <FormLabel
            tooltip={t('knowledge.settings.fields.permissionTooltip')}
            className="w-1/4 shrink-0 text-sm text-text-secondary"
          >
            {t('knowledge.settings.fields.permission')}
          </FormLabel>
          <div className="w-3/4">
            <FormControl>
              <SelectWithSearch
                value={field.value}
                onChange={field.onChange}
                options={options}
                placeholder={t('knowledge.settings.fields.permission')}
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// =====================================================
// 嵌入模型选择 (需要从外部传入模型列表)
// =====================================================
interface EmbeddingModelFormFieldProps {
  name?: string
  options: SelectOptionGroup[]
  loading?: boolean
  disabled?: boolean
  className?: string
}

export function EmbeddingModelFormField({
  name = 'embd_id',
  options,
  loading = false,
  disabled = false,
  className,
}: EmbeddingModelFormFieldProps) {
  const { t } = useTranslation()
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn('flex items-center gap-1 space-y-0', className)}
        >
          <FormLabel
            required
            tooltip={t('knowledge.settings.fields.embeddingModelTooltip')}
            className="w-1/4 shrink-0 text-sm text-text-secondary"
          >
            {t('knowledge.settings.fields.embeddingModel')}
          </FormLabel>
          <div className="w-3/4">
            <FormControl>
              <SelectWithSearch
                value={field.value}
                onChange={field.onChange}
                options={options}
                placeholder={
                  loading
                    ? t('knowledge.settings.fields.loading')
                    : t('knowledge.settings.fields.embeddingModelPlaceholder')
                }
                disabled={disabled || loading}
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// =====================================================
// 解析器类型选择 (需要从外部传入选项列表)
// =====================================================
interface ParserTypeFormFieldProps {
  name?: string
  options: SelectOptionGroup[]
  className?: string
}

export function ParserTypeFormField({
  name = 'parser_id',
  options,
  className,
}: ParserTypeFormFieldProps) {
  const { t } = useTranslation()
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn('flex items-center gap-1 space-y-0', className)}
        >
          <FormLabel
            required
            tooltip={t('knowledge.settings.fields.chunkMethodTooltip')}
            className="w-1/4 shrink-0 text-sm text-text-secondary"
          >
            {t('knowledge.settings.fields.parserType')}
          </FormLabel>
          <div className="w-3/4">
            <FormControl>
              <SelectWithSearch
                value={field.value}
                onChange={field.onChange}
                options={options}
                placeholder={t(
                  'knowledge.settings.fields.parserTypePlaceholder',
                )}
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// =====================================================
// MinerU 选项（条件渲染，当选择 MinerU 时显示）
// =====================================================
interface MinerUOptionsFormFieldProps {
  className?: string
}

export function MinerUOptionsFormField({
  className,
}: MinerUOptionsFormFieldProps) {
  const { t } = useTranslation()
  const form = useFormContext()

  // 监听 layout_recognize 字段的变化
  const layoutRecognize = form.watch('parser_config.layout_recognize')

  // 检查是否选择了 MinerU
  const isMinerUSelected =
    layoutRecognize?.includes('MinerU') ||
    layoutRecognize?.toLowerCase()?.includes('mineru')

  // 如果没有选择 MinerU，不渲染任何内容
  if (!isMinerUSelected) {
    return null
  }

  const parseMethodOptions: SelectOptionGroup[] = MineruParseMethodOptions.map(
    (opt) => ({
      label: opt.label,
      value: opt.value,
    }),
  )

  const languageOptions: SelectOptionGroup[] = MineruLanguageOptions.map(
    (opt) => ({
      label: opt.label,
      value: opt.value,
    }),
  )

  return (
    <div
      className={cn(
        'ml-2 space-y-4 border-l-2 border-border-accent pl-4',
        className,
      )}
    >
      <div className="text-sm font-medium text-text-secondary">
        {t('knowledge.settings.fields.mineruOptions')}
      </div>

      {/* 解析方法 */}
      <FormField
        control={form.control}
        name="parser_config.mineru_parse_method"
        render={({ field }) => (
          <FormItem className="flex items-center gap-1 space-y-0">
            <FormLabel
              tooltip={t('knowledge.settings.fields.mineruParseMethodTooltip')}
              className="w-1/4 shrink-0 text-sm text-text-secondary"
            >
              {t('knowledge.settings.fields.mineruParseMethod')}
            </FormLabel>
            <div className="w-3/4">
              <FormControl>
                <SelectWithSearch
                  value={field.value || 'auto'}
                  onChange={field.onChange}
                  options={parseMethodOptions}
                  placeholder={t(
                    'knowledge.settings.fields.mineruParseMethodPlaceholder',
                  )}
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* OCR 语言 */}
      <FormField
        control={form.control}
        name="parser_config.mineru_lang"
        render={({ field }) => (
          <FormItem className="flex items-center gap-1 space-y-0">
            <FormLabel
              tooltip={t('knowledge.settings.fields.mineruLanguageTooltip')}
              className="w-1/4 shrink-0 text-sm text-text-secondary"
            >
              {t('knowledge.settings.fields.mineruLanguage')}
            </FormLabel>
            <div className="w-3/4">
              <FormControl>
                <SelectWithSearch
                  value={field.value || 'English'}
                  onChange={field.onChange}
                  options={languageOptions}
                  placeholder={t(
                    'knowledge.settings.fields.mineruLanguagePlaceholder',
                  )}
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 公式识别 */}
      <FormField
        control={form.control}
        name="parser_config.mineru_formula_enable"
        render={({ field }) => (
          <FormItem className="flex items-center gap-1 space-y-0">
            <FormLabel
              tooltip={t('knowledge.settings.fields.mineruFormulaTooltip')}
              className="w-1/4 shrink-0 text-sm text-text-secondary"
            >
              {t('knowledge.settings.fields.mineruFormula')}
            </FormLabel>
            <div className="w-3/4">
              <FormControl>
                <Switch
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 表格识别 */}
      <FormField
        control={form.control}
        name="parser_config.mineru_table_enable"
        render={({ field }) => (
          <FormItem className="flex items-center gap-1 space-y-0">
            <FormLabel
              tooltip={t('knowledge.settings.fields.mineruTableTooltip')}
              className="w-1/4 shrink-0 text-sm text-text-secondary"
            >
              {t('knowledge.settings.fields.mineruTable')}
            </FormLabel>
            <div className="w-3/4">
              <FormControl>
                <Switch
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

// =====================================================
// 自动元数据 - 参照 ragflow 的 AutoMetadata 组件
// =====================================================
interface AutoMetadataFormFieldProps {
  name?: string
  className?: string
  /** 已配置的元数据字段数量（可选，优先使用 Context 中的值） */
  metadataCount?: number
  /** 点击设置按钮的回调（可选，优先使用 Context 中的值） */
  onSettingsClick?: () => void
  /** 是否显示设置按钮 */
  showSettingsButton?: boolean
}

export function AutoMetadataFormField({
  name = 'parser_config.enable_metadata',
  className,
  metadataCount: propMetadataCount,
  onSettingsClick: propOnSettingsClick,
  showSettingsButton = true,
}: AutoMetadataFormFieldProps) {
  const { t } = useTranslation()
  const form = useFormContext()

  // 使用 props 传入的回调和数量
  const onSettingsClick = propOnSettingsClick
  const metadataCount = propMetadataCount ?? 0

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn('flex items-center gap-1 space-y-0', className)}
        >
          <FormLabel
            tooltip={t('knowledge.settings.fields.autoMetadataTooltip')}
            className="w-1/4 shrink-0 text-sm text-text-secondary"
          >
            {t('knowledge.settings.fields.autoMetadata')}
          </FormLabel>
          <div className="flex w-3/4 items-center justify-between">
            {/* 设置按钮 */}
            {showSettingsButton && onSettingsClick && (
              <button
                type="button"
                onClick={onSettingsClick}
                className="hover:bg-surface-secondary inline-flex h-8 items-center rounded-md px-3 text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                <svg
                  className="mr-1.5 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                {t('knowledge.settings.fields.settings')}
                {metadataCount > 0 && (
                  <span className="ml-1.5 text-xs text-text-tertiary">
                    ({metadataCount})
                  </span>
                )}
              </button>
            )}
            {/* 如果没有设置按钮，添加一个空占位 */}
            {(!showSettingsButton || !onSettingsClick) && <div />}

            {/* 启用开关 */}
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// =====================================================
// 子分块用于检索 (Children Delimiter)
// =====================================================
interface ChildrenDelimiterFormFieldProps {
  className?: string
}
export function ChildrenDelimiterFormField({
  className,
}: ChildrenDelimiterFormFieldProps) {
  const { t } = useTranslation()
  const form = useFormContext()
  const enableChildren = form.watch('parser_config.enable_children')

  // 格式化显示值：将实际的换行符转为转义字符串
  const formatValue = (val: string | undefined): string => {
    if (!val) return ''
    return val.replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r')
  }

  // 解析输入值：将转义字符串转为实际换行符
  const parseValue = (val: string): string => {
    return val.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r')
  }

  return (
    <fieldset className={cn('space-y-3', className)}>
      {/* 启用开关 */}
      <FormField
        control={form.control}
        name="parser_config.enable_children"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between space-y-0">
            <FormLabel
              tooltip={t('knowledge.settings.fields.childrenChunksTooltip')}
              className="text-sm text-text-secondary"
            >
              {t('knowledge.settings.fields.childrenChunks')}
            </FormLabel>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  // 如果启用且没有设置分隔符，设置默认值
                  if (
                    checked &&
                    !form.getValues('parser_config.children_delimiter')
                  ) {
                    form.setValue('parser_config.children_delimiter', '\n')
                  }
                  field.onChange(checked)
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />{' '}
      {/* 子分隔符输入 - 仅在启用时显示 */}
      {enableChildren && (
        <FormField
          control={form.control}
          name="parser_config.children_delimiter"
          render={({ field }) => (
            <FormItem className="flex items-center gap-1 space-y-0">
              <FormLabel
                required
                tooltip={t('knowledge.settings.fields.childDelimiterTooltip')}
                className="w-[140px] shrink-0 text-sm text-text-secondary"
              >
                {t('knowledge.settings.fields.childDelimiter')}
              </FormLabel>
              <div className="flex-1">
                <FormControl>
                  <Input
                    value={formatValue(field.value)}
                    onChange={(e) => field.onChange(parseValue(e.target.value))}
                    placeholder="\n"
                    className="h-9"
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </fieldset>
  )
}

// =====================================================
// 重叠百分比 (Overlapped Percent)
// =====================================================
interface OverlappedPercentFormFieldProps {
  name?: string
  className?: string
}

export function OverlappedPercentFormField({
  name = 'parser_config.overlapped_percent',
  className,
}: OverlappedPercentFormFieldProps) {
  const { t } = useTranslation()

  return (
    <SliderInputFormField
      name={name}
      label={t('knowledge.settings.fields.overlappedPercent')}
      tooltip={t('knowledge.settings.fields.overlappedPercentTooltip')}
      min={0}
      max={0.3}
      step={0.01}
      defaultValue={0}
      layout="horizontal"
      className={className}
      percentage
    />
  )
}
