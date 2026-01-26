/**
 * 记忆库设置页面
 * 优化版本：水平布局表单 + 高级设置折叠 + 模型选择器对接
 * 
 * 禁用逻辑（参考 ragflow）：
 * - 嵌入模型：始终禁用（创建后不能修改）
 * - LLM 模型、记忆类型：当记忆库中有消息记录时禁用
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, Loader2, HelpCircle, User, Users, RotateCcw, AlertCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Form,
  FormControl,
  FormField,
  FormMessage,
} from '@/components/ui/form'
import {
  TooltipRoot as Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { ChatModelSelector } from '@/components/memory/ChatModelSelector'
import { MemoryTypeSelect } from '@/components/memory/MemoryTypeSelect'
import { AvatarUpload } from '@/components/memory/AvatarUpload'
import { IconFontFill } from '@/components/ui/icon-font'
import { formatBytes, cn } from '@/lib/utils'
import { useMemoryConfig, useUpdateMemory, useMessageList } from '@/hooks/use-memory'
import { IconMap, LLMFactory } from '@/stores/model'
import { useIsDarkTheme } from '@/themes'
import { MEMORY_TEXTS } from '@/constants/memory-texts'

// 表单验证 Schema
// 注意：后端不允许修改 storage_type, embd_id
// memory_type 和 llm_id 在有消息记录时禁用编辑
const memorySettingsSchema = z.object({
  name: z.string().min(1, MEMORY_TEXTS.memories.nameRequired),
  description: z.string().optional(),
  avatar: z.string().optional(),
  memory_type: z
    .array(z.string())
    .min(1, MEMORY_TEXTS.memories.memoryTypeRequired)
    .refine((arr) => arr.includes('raw'), {
      message: MEMORY_TEXTS.memories.rawRequired,
    }),
  permissions: z.enum(['me', 'team'] as const),
  llm_id: z.string().min(1, MEMORY_TEXTS.memories.selectLlmRequired),
  memory_size: z.number().min(1048576).max(104857600), // 1MB - 100MB
  forgetting_policy: z.enum(['FIFO', 'LRU'] as const),
  temperature: z.number().min(0).max(1),  // 后端限制 0-1
  system_prompt: z.string().optional(),
  user_prompt: z.string().optional(),
})

type MemorySettingsFormValues = z.infer<typeof memorySettingsSchema>

// 水平表单项组件
interface HorizontalFormItemProps {
  label: string
  required?: boolean
  tooltip?: string
  disabled?: boolean
  disabledHint?: string
  children: React.ReactNode
  className?: string
}

const HorizontalFormItem: React.FC<HorizontalFormItemProps> = ({
  label,
  required,
  tooltip,
  disabled,
  disabledHint,
  children,
  className,
}) => (
  <div className={cn('flex items-start gap-4', className)}>
    <div className="w-28 shrink-0 pt-2.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-sm text-text-secondary">{label}</span>
        {required && <span className="text-status-error">*</span>}
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-text-tertiary cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs whitespace-pre-line">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {disabled && disabledHint && (
          <span className="text-xs text-text-tertiary">({disabledHint})</span>
        )}
      </div>
    </div>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
)

// 只读字段组件
interface ReadOnlyFieldProps {
  value: React.ReactNode
}

const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({ value }) => (
  <div className="h-10 px-3 flex items-center rounded-md border border-border-default bg-surface-secondary/50 text-text-secondary text-sm">
    {value || '-'}
  </div>
)

// 需要主题切换的厂商
const THEME_AWARE_FACTORIES: string[] = [
  LLMFactory.FishAudio,
  LLMFactory.TogetherAI,
  LLMFactory.Meituan,
  LLMFactory.Longcat,
]

// 获取图标名称
const getIconName = (provider: string, isDark: boolean): string => {
  const baseIcon = IconMap[provider as keyof typeof IconMap] || 'moxing-default'
  if (THEME_AWARE_FACTORIES.includes(provider)) {
    return isDark ? `${baseIcon}-dark` : `${baseIcon}-bright`
  }
  return baseIcon
}

// 带厂商图标的只读模型字段组件
interface ReadOnlyModelFieldProps {
  modelId: string | undefined
}

const ReadOnlyModelField: React.FC<ReadOnlyModelFieldProps> = ({ modelId }) => {
  const isDark = useIsDarkTheme()
  
  if (!modelId) {
    return (
      <div className="h-10 px-3 flex items-center rounded-md border border-border-default bg-surface-secondary/50 text-text-tertiary text-sm">
        -
      </div>
    )
  }
  
  // 解析模型 ID，格式：modelName@providerName
  const atIndex = modelId.lastIndexOf('@')
  const modelName = atIndex > 0 ? modelId.substring(0, atIndex) : modelId
  const provider = atIndex > 0 ? modelId.substring(atIndex + 1) : ''
  const iconName = provider ? getIconName(provider, isDark) : 'moxing-default'
  
  return (
    <div className="h-10 px-3 flex items-center gap-2 rounded-md border border-border-default bg-surface-secondary/50 text-text-secondary text-sm">
      <IconFontFill name={iconName} className="w-5 h-5 shrink-0" />
      <span className="truncate">{modelName}</span>
      <Lock className="h-3.5 w-3.5 text-text-tertiary ml-auto shrink-0" />
    </div>
  )
}

export const MemorySettingsPage: React.FC = () => {
  const { id: memoryId } = useParams<{ id: string }>()

  // 获取配置
  const { data: config, isLoading } = useMemoryConfig(memoryId)
  const updateMutation = useUpdateMemory()
  
  // 获取消息数量，用于判断是否允许编辑某些字段
  const { data: messageData } = useMessageList(memoryId, { page: 1, page_size: 1 })
  const messageCount = messageData?.total_count || 0
  
  // 是否有消息记录 - 决定 memory_type 和 llm_id 是否可编辑
  const hasMessages = messageCount > 0

  // 生成头像渐变背景
  const avatarGradient = React.useMemo(() => {
    const name = config?.name || 'M'
    const gradients = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
    ]
    const index = name.charCodeAt(0) % gradients.length
    return gradients[index]
  }, [config?.name])

  // 表单
  const form = useForm<MemorySettingsFormValues>({
    resolver: zodResolver(memorySettingsSchema),
    defaultValues: {
      name: '',
      description: '',
      avatar: '',
      memory_type: ['raw'],
      permissions: 'me',
      llm_id: '',
      memory_size: 5242880, // 5MB
      forgetting_policy: 'FIFO',
      temperature: 0.7,
      system_prompt: '',
      user_prompt: '',
    },
  })

  // 加载配置后填充表单
  React.useEffect(() => {
    if (config) {
      form.reset({
        name: config.name,
        description: config.description || '',
        avatar: config.avatar || '',
        memory_type: config.memory_type || ['raw'],
        permissions: config.permissions,
        llm_id: config.llm_id,
        memory_size: config.memory_size,
        forgetting_policy: config.forgetting_policy,
        temperature: config.temperature || 0.7,
        system_prompt: config.system_prompt || '',
        user_prompt: config.user_prompt || '',
      })
    }
  }, [config, form])

  // 提交表单
  const onSubmit = (values: MemorySettingsFormValues) => {
    if (!memoryId) return
    
    // 如果有消息记录，不提交 memory_type（后端也不接受）
    const submitData = hasMessages 
      ? { ...values, memory_type: undefined }
      : values
    
    updateMutation.mutate({
      id: memoryId,
      data: submitData,
    })
  }

  // 重置表单
  const handleReset = () => {
    if (config) {
      form.reset({
        name: config.name,
        description: config.description || '',
        avatar: config.avatar || '',
        memory_type: config.memory_type || ['raw'],
        permissions: config.permissions,
        llm_id: config.llm_id,
        memory_size: config.memory_size,
        forgetting_policy: config.forgetting_policy,
        temperature: config.temperature || 0.7,
        system_prompt: config.system_prompt || '',
        user_prompt: config.user_prompt || '',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto py-6 px-6">
        {/* 页面标题 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-text-primary">
            {MEMORY_TEXTS.config.pageTitle}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {MEMORY_TEXTS.config.pageDescription}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* ==================== 基础信息 ==================== */}
            <section className="space-y-5">
              <h3 className="text-base font-medium text-text-primary">
                {MEMORY_TEXTS.config.basicInfo}
              </h3>

              {/* 头像 */}
              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <HorizontalFormItem label="头像">
                    <AvatarUpload
                      value={field.value}
                      onChange={field.onChange}
                      size="lg"
                      fallbackLetter={form.watch('name')?.charAt(0) || 'M'}
                      gradientClass={avatarGradient}
                      tips="支持 JPG、PNG，最大 5MB"
                    />
                    <FormMessage className="mt-1" />
                  </HorizontalFormItem>
                )}
              />
              
              {/* 名称 */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <HorizontalFormItem label={MEMORY_TEXTS.memories.name} required>
                    <FormControl>
                      <Input
                        placeholder={MEMORY_TEXTS.memories.memoryNamePlaceholder}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="mt-1" />
                  </HorizontalFormItem>
                )}
              />

              {/* 描述 */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <HorizontalFormItem label={MEMORY_TEXTS.config.description}>
                    <FormControl>
                      <Textarea
                        placeholder={MEMORY_TEXTS.config.descriptionPlaceholder}
                        rows={3}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="mt-1" />
                  </HorizontalFormItem>
                )}
              />

              {/* 记忆类型 - 有消息时禁用 */}
              <FormField
                control={form.control}
                name="memory_type"
                render={({ field }) => (
                  <HorizontalFormItem 
                    label={MEMORY_TEXTS.memories.memoryType}
                    required
                    disabled={hasMessages}
                    disabledHint={hasMessages ? `已有 ${messageCount} 条消息` : undefined}
                    tooltip={MEMORY_TEXTS.memories.memoryTypeTooltip}
                  >
                    {hasMessages ? (
                      // 有消息时只读展示
                      <div className="flex flex-wrap gap-2">
                        {field.value?.map((type) => (
                          <span
                            key={type}
                            className="px-2.5 py-1 text-xs rounded-md bg-surface-accent/10 text-text-accent font-medium"
                          >
                            {type}
                          </span>
                        )) || <span className="text-text-tertiary text-sm">-</span>}
                      </div>
                    ) : (
                      // 无消息时可编辑
                      <>
                        <FormControl>
                          <MemoryTypeSelect
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage className="mt-1" />
                      </>
                    )}
                  </HorizontalFormItem>
                )}
              />
            </section>

            <Separator />

            {/* ==================== 模型配置 ==================== */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-text-primary">
                  {MEMORY_TEXTS.config.modelConfig}
                </h3>
                {hasMessages && (
                  <div className="flex items-center gap-1.5 text-xs text-status-warning">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>已有 {messageCount} 条消息记录，部分配置无法修改</span>
                  </div>
                )}
              </div>

              {/* 嵌入模型 - 始终只读 */}
              <HorizontalFormItem 
                label={MEMORY_TEXTS.memories.embeddingModel} 
                tooltip={MEMORY_TEXTS.memories.embeddingModelTooltip}
                disabled 
                disabledHint={MEMORY_TEXTS.common.notEditable}
              >
                <ReadOnlyModelField modelId={config?.embd_id} />
              </HorizontalFormItem>

              {/* LLM 模型 - 有消息时禁用 */}
              <FormField
                control={form.control}
                name="llm_id"
                render={({ field }) => (
                  <HorizontalFormItem 
                    label={MEMORY_TEXTS.memories.llm} 
                    required
                    tooltip={MEMORY_TEXTS.memories.llmTooltip}
                    disabled={hasMessages}
                    disabledHint={hasMessages ? `已有 ${messageCount} 条消息` : undefined}
                  >
                    {hasMessages ? (
                      // 有消息时只读展示（带厂商图标）
                      <ReadOnlyModelField modelId={field.value} />
                    ) : (
                      // 无消息时可编辑
                      <>
                        <ChatModelSelector
                          selectedModelId={field.value}
                          onSelect={(id) => field.onChange(id || '')}
                          showLabel={false}
                        />
                        <FormMessage className="mt-1" />
                      </>
                    )}
                  </HorizontalFormItem>
                )}
              />
            </section>

            <Separator />

            {/* ==================== 高级设置（可折叠） ==================== */}
            <CollapsibleSection title={MEMORY_TEXTS.config.advancedSettings} defaultOpen={false}>
              <div className="space-y-5">
                {/* 权限 */}
                <FormField
                  control={form.control}
                  name="permissions"
                  render={({ field }) => (
                    <HorizontalFormItem label={MEMORY_TEXTS.config.permission}>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex gap-6"
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="me" id="perm-me" />
                            <Label
                              htmlFor="perm-me"
                              className="flex items-center gap-1.5 cursor-pointer text-sm"
                            >
                              <User className="h-4 w-4" />
                              {MEMORY_TEXTS.config.onlyMe}
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="team" id="perm-team" />
                            <Label
                              htmlFor="perm-team"
                              className="flex items-center gap-1.5 cursor-pointer text-sm"
                            >
                              <Users className="h-4 w-4" />
                              {MEMORY_TEXTS.config.team}
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage className="mt-1" />
                    </HorizontalFormItem>
                  )}
                />

                {/* 存储类型 - 只读 */}
                <HorizontalFormItem 
                  label={MEMORY_TEXTS.config.storageType} 
                  disabled 
                  disabledHint={MEMORY_TEXTS.common.notEditable}
                >
                  <ReadOnlyField 
                    value={config?.storage_type === 'graph' ? MEMORY_TEXTS.config.graph : MEMORY_TEXTS.config.table} 
                  />
                </HorizontalFormItem>

                {/* 记忆大小 */}
                <FormField
                  control={form.control}
                  name="memory_size"
                  render={({ field }) => (
                    <HorizontalFormItem 
                      label={MEMORY_TEXTS.config.memorySize}
                      tooltip={MEMORY_TEXTS.config.memorySizeTooltip}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <FormControl>
                            <Slider
                              min={1048576}
                              max={104857600}
                              step={1048576}
                              value={[field.value]}
                              onValueChange={([value]) => field.onChange(value)}
                              className="flex-1"
                            />
                          </FormControl>
                          <span className="ml-4 text-sm text-text-secondary min-w-[60px] text-right">
                            {formatBytes(field.value)}
                          </span>
                        </div>
                      </div>
                      <FormMessage className="mt-1" />
                    </HorizontalFormItem>
                  )}
                />

                {/* 遗忘策略 */}
                <FormField
                  control={form.control}
                  name="forgetting_policy"
                  render={({ field }) => (
                    <HorizontalFormItem label={MEMORY_TEXTS.config.forgettingPolicy}>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="FIFO">
                          {MEMORY_TEXTS.config.fifo}
                        </SelectItem>
                        <SelectItem value="LRU">
                            {MEMORY_TEXTS.config.lru}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="mt-1" />
                    </HorizontalFormItem>
                  )}
                />

                {/* 温度 */}
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <HorizontalFormItem 
                      label={MEMORY_TEXTS.config.temperature}
                      tooltip={MEMORY_TEXTS.config.temperatureTooltip}
                    >
                      <div className="flex items-center gap-4">
                        <FormControl>
                          <Slider
                            min={0}
                            max={1}
                            step={0.1}
                            value={[field.value]}
                            onValueChange={([value]) => field.onChange(value)}
                            className="flex-1"
                          />
                        </FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step={0.1}
                          value={field.value}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          className="w-20 h-8 text-center"
                        />
                      </div>
                      <FormMessage className="mt-1" />
                    </HorizontalFormItem>
                  )}
                />

                {/* 系统提示词 */}
                <FormField
                  control={form.control}
                  name="system_prompt"
                  render={({ field }) => (
                    <HorizontalFormItem label={MEMORY_TEXTS.config.systemPrompt} className="items-start">
                      <FormControl>
                        <Textarea
                          placeholder={MEMORY_TEXTS.config.systemPromptPlaceholder}
                          rows={4}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="mt-1" />
                    </HorizontalFormItem>
                  )}
                />

                {/* 用户提示词 */}
                <FormField
                  control={form.control}
                  name="user_prompt"
                  render={({ field }) => (
                    <HorizontalFormItem label={MEMORY_TEXTS.config.userPrompt} className="items-start">
                      <FormControl>
                        <Textarea
                          placeholder={MEMORY_TEXTS.config.userPromptPlaceholder}
                          rows={4}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="mt-1" />
                    </HorizontalFormItem>
                  )}
                />
              </div>
            </CollapsibleSection>

            {/* ==================== 操作按钮 ==================== */}
            <div className="flex justify-end gap-3 pt-6 border-t border-border-default">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={updateMutation.isPending}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {MEMORY_TEXTS.common.cancel}
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="gap-2"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {MEMORY_TEXTS.config.save}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

MemorySettingsPage.displayName = 'MemorySettingsPage'
