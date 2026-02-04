'use client'

import { useFormContext } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { SelectWithSearch, type SelectOptionGroup } from '@/components/ui/select-with-search'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { SliderInputFormField } from './SliderInputFormField'
import { LayoutRecognizeOptions, PermissionOptions, MineruParseMethodOptions, MineruLanguageOptions } from '@/types/knowledge-form'

// =====================================================
// 布局识别/PDF解析器选择
// =====================================================
interface LayoutRecognizeFormFieldProps {
  name?: string
  horizontal?: boolean
  className?: string
}

export function LayoutRecognizeFormField({
  name = 'parser_config.layout_recognize',
  horizontal = true,
  className,
}: LayoutRecognizeFormFieldProps) {
  const form = useFormContext()

  const options: SelectOptionGroup[] = LayoutRecognizeOptions.map((opt) => ({
    label: opt.label,
    value: opt.value,
  }))

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(horizontal && 'flex items-center gap-1 space-y-0', className)}>
          <FormLabel
            tooltip="使用视觉模型进行 PDF 布局分析，以更好地识别文档结构，找到标题、文本块、图像和表格的位置。如果选择 Naive 选项，则只能获取 PDF 的纯文本。请注意该功能只适用于 PDF 文档，对其他文档不生效。"
            className={cn('text-sm text-text-secondary', horizontal && 'w-1/4 shrink-0')}
          >
            PDF解析器
          </FormLabel>
          <div className={horizontal ? 'w-3/4' : 'w-full'}>
            <FormControl>
              <SelectWithSearch
                value={field.value}
                onChange={field.onChange}
                options={options}
                placeholder="请选择解析器"
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
  return (
    <SliderInputFormField
      name={name}
      label="建议文本块大小"
      tooltip="建议的生成文本块的 token 数阈值。如果切分得到的小文本段 token 数达不到这一阈值就会不断与之后的文本段合并，直至再合并下一个文本段会超过这一阈值为止，此时产生一个最终文本块。如果系统在切分文本段时始终没有遇到文本分段标识符，即便文本段 token 数已经超过这一阈值，系统也不会生成新文本块。"
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
        <FormItem className={cn('flex items-center gap-1 space-y-0', className)}>
          <FormLabel
            required
            tooltip="支持多字符作为分隔符，多字符用两个反引号 `` 分隔符包裹。若配置成：\n`##`; 系统将首先使用换行符、两个#号以及分号先对文本进行分割，随后再对分得的小文本块按照「建议文本块大小」设定的大小进行拼装。在设置文本分段标识符前请确保理解上述文本分段切片机制。"
            className="text-sm text-text-secondary w-1/4 shrink-0"
          >
            文本分段标识符
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
  return (
    <SliderInputFormField
      name={name}
      label="自动关键词提取"
      tooltip="自动为每个文本块中提取 N 个关键词，用以提升查询精度。请注意：该功能采用「系统模型设置」中设置的默认聊天模型提取关键词，因此也会产生更多 Token 消耗。另外，你也可以手动更新生成的关键词。"
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
  return (
    <SliderInputFormField
      name={name}
      label="自动问题提取"
      tooltip="利用「系统模型设置」中设置的 chat model 对知识库的每个文本块提取 N 个问题以提高其排名得分。请注意，开启后将消耗额外的 token。您可以在块列表中查看、编辑结果。如果自动问题提取发生错误，不会妨碍整个分块过程，只会将空结果添加到原始文本块。"
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
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex items-center gap-1 space-y-0', className)}>
          <FormLabel
            tooltip="与 General 切片方法配合使用。未开启状态下，表格文件（XLSX、XLS（Excel 97-2003））会按行解析为键值对。开启后，表格文件会被解析为 HTML 表格。若原始表格超过 12 行，系统会自动按每 12 行拆分为多个 HTML 表格。"
            className="text-sm text-text-secondary w-1/4 shrink-0"
          >
            表格转HTML
          </FormLabel>
          <div className="w-3/4">
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
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
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex items-center gap-1 space-y-0', className)}>
          <FormLabel
            tooltip="对于已有的 chunk 生成层级结构的目录信息（每个文件一个目录）。在查询时，激活「目录增强」后，系统会用大模型去判断用户问题和哪些目录项相关，从而找到相关的 chunk。"
            className="text-sm text-text-secondary w-1/4 shrink-0"
          >
            目录增强
          </FormLabel>
          <div className="w-3/4">
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
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
  return (
    <SliderInputFormField
      name={name}
      label="图像与表格上下文窗口"
      tooltip="捕获图像与表格上下方 N 个 token 的文本内容，为该 chunk 提供更丰富的背景上下文信息。设置为 0 表示不捕获上下文。"
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
  return (
    <SliderInputFormField
      name={name}
      label="PageRank权重"
      tooltip="知识库检索时，你可以为特定知识库设置较高的 PageRank 分数，该知识库中匹配文本块的混合相似度得分会自动叠加 PageRank 分数，从而提升排序权重。"
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
  const form = useFormContext()

  const options: SelectOptionGroup[] = PermissionOptions.map((opt) => ({
    label: opt.label,
    value: opt.value,
  }))

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex items-center gap-1 space-y-0', className)}>
          <FormLabel
            tooltip="如果把知识库权限设为「团队」，则所有团队成员都可以操作该知识库。"
            className="text-sm text-text-secondary w-1/4 shrink-0"
          >
            访问权限
          </FormLabel>
          <div className="w-3/4">
            <FormControl>
              <SelectWithSearch
                value={field.value}
                onChange={field.onChange}
                options={options}
                placeholder="请选择权限"
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
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex items-center gap-1 space-y-0', className)}>
          <FormLabel
            required
            tooltip="知识库采用的默认嵌入模型。一旦知识库内已经产生了文本块后，你将无法更改默认的嵌入模型，除非删除知识库内的所有文本块。"
            className="text-sm text-text-secondary w-1/4 shrink-0"
          >
            嵌入模型
          </FormLabel>
          <div className="w-3/4">
            <FormControl>
              <SelectWithSearch
                value={field.value}
                onChange={field.onChange}
                options={options}
                placeholder={loading ? '加载中...' : '请选择嵌入模型'}
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
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex items-center gap-1 space-y-0', className)}>
          <FormLabel
            required
            tooltip="选择文档的解析方式，不同的解析器适用于不同类型的文档。"
            className="text-sm text-text-secondary w-1/4 shrink-0"
          >
            解析器类型
          </FormLabel>
          <div className="w-3/4">
            <FormControl>
              <SelectWithSearch
                value={field.value}
                onChange={field.onChange}
                options={options}
                placeholder="请选择解析器类型"
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
  const form = useFormContext()

  // 监听 layout_recognize 字段的变化
  const layoutRecognize = form.watch('parser_config.layout_recognize')

  // 检查是否选择了 MinerU
  const isMinerUSelected = layoutRecognize?.includes('MinerU') || layoutRecognize?.toLowerCase()?.includes('mineru')

  // 如果没有选择 MinerU，不渲染任何内容
  if (!isMinerUSelected) {
    return null
  }

  const parseMethodOptions: SelectOptionGroup[] = MineruParseMethodOptions.map((opt) => ({
    label: opt.label,
    value: opt.value,
  }))

  const languageOptions: SelectOptionGroup[] = MineruLanguageOptions.map((opt) => ({
    label: opt.label,
    value: opt.value,
  }))

  return (
    <div className={cn('border-l-2 border-border-accent pl-4 ml-2 space-y-4', className)}>
      <div className="text-sm font-medium text-text-secondary">
        MinerU 选项
      </div>

      {/* 解析方法 */}
      <FormField
        control={form.control}
        name="parser_config.mineru_parse_method"
        render={({ field }) => (
          <FormItem className="flex items-center gap-1 space-y-0">
            <FormLabel
              tooltip="PDF 解析方法：auto（自动检测）、txt（文本提取）、ocr（光学字符识别）"
              className="text-sm text-text-secondary w-1/4 shrink-0"
            >
              解析方法
            </FormLabel>
            <div className="w-3/4">
              <FormControl>
                <SelectWithSearch
                  value={field.value || 'auto'}
                  onChange={field.onChange}
                  options={parseMethodOptions}
                  placeholder="请选择解析方法"
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
              tooltip="MinerU OCR 首选语言设置。"
              className="text-sm text-text-secondary w-1/4 shrink-0"
            >
              OCR 语言
            </FormLabel>
            <div className="w-3/4">
              <FormControl>
                <SelectWithSearch
                  value={field.value || 'English'}
                  onChange={field.onChange}
                  options={languageOptions}
                  placeholder="请选择语言"
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
              tooltip="启用公式识别。注意：对于西里尔文档可能无法正常工作。"
              className="text-sm text-text-secondary w-1/4 shrink-0"
            >
              公式识别
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
              tooltip="启用表格识别和提取。"
              className="text-sm text-text-secondary w-1/4 shrink-0"
            >
              表格识别
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
  const form = useFormContext()

  // 使用 props 传入的回调和数量
  const onSettingsClick = propOnSettingsClick
  const metadataCount = propMetadataCount ?? 0

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex items-center gap-1 space-y-0', className)}>
          <FormLabel
            tooltip="自动从文档中提取元数据。启用后，系统会使用 AI 模型根据预定义的字段模板自动提取文档的元数据信息。"
            className="text-sm text-text-secondary w-1/4 shrink-0"
          >
            自动元数据
          </FormLabel>
          <div className="w-3/4 flex items-center justify-between">
            {/* 设置按钮 */}
            {showSettingsButton && onSettingsClick && (
              <button
                type="button"
                onClick={onSettingsClick}
                className="inline-flex items-center h-8 px-3 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-md transition-colors"
              >
                <svg 
                  className="w-4 h-4 mr-1.5" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                设置
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
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
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
// 子分块用于检索 (Children Delimiter)
// =====================================================
interface ChildrenDelimiterFormFieldProps {
  className?: string
}

export function ChildrenDelimiterFormField({
  className,
}: ChildrenDelimiterFormFieldProps) {
  const form = useFormContext()
  const enableChildren = form.watch('parser_config.enable_children')

  // 格式化显示值：将实际的换行符转为转义字符串
  const formatValue = (val: string | undefined): string => {
    if (!val) return ''
    return val
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t')
      .replace(/\r/g, '\\r')
  }

  // 解析输入值：将转义字符串转为实际换行符
  const parseValue = (val: string): string => {
    return val
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
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
              tooltip="启用后，系统会使用子分隔符将父文本块进一步拆分为子文本块。检索时使用子文本块进行匹配，但返回的是对应的父文本块，从而提供更完整的上下文信息。"
              className="text-sm text-text-secondary"
            >
              子分块用于检索
            </FormLabel>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  // 如果启用且没有设置分隔符，设置默认值
                  if (checked && !form.getValues('parser_config.children_delimiter')) {
                    form.setValue('parser_config.children_delimiter', '\n')
                  }
                  field.onChange(checked)
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />      {/* 子分隔符输入 - 仅在启用时显示 */}
      {enableChildren && (
        <FormField
          control={form.control}
          name="parser_config.children_delimiter"
          render={({ field }) => (
            <FormItem className="flex items-center gap-1 space-y-0">
              <FormLabel
                required
                tooltip="用于将父文本块拆分为子文本块的分隔符。支持转义字符如 \\n（换行）、\\t（制表符）等。"
                className="text-sm text-text-secondary w-[140px] shrink-0"
              >
                子分隔符
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
  return (
    <SliderInputFormField
      name={name}
      label="重叠百分比"
      tooltip="相邻文本块之间的重叠比例。较高的重叠可以保持更好的上下文连续性，但会增加存储空间和处理时间。建议值为 10%-20%。"
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
