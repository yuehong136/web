/**
 * 创建/编辑记忆库弹窗组件
 * 
 * 创建模式：显示所有字段（名称、头像、记忆类型、嵌入模型、LLM 模型）
 * 编辑模式：只显示名称和头像（其他配置在设置页面修改）
 */

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Brain, Loader2, HelpCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  TooltipRoot as Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MemoryTypeSelect } from './MemoryTypeSelect'
import { ChatModelSelector } from './ChatModelSelector'
import { AvatarUpload } from './AvatarUpload'
import { EmbeddingModelSelector } from '@/components/knowledge/EmbeddingModelSelector'
import { cn } from '@/lib/utils'
import { MEMORY_TEXTS } from '@/constants/memory-texts'
import type { Memory, CreateMemoryParams, UpdateMemoryParams } from '@/types/memory'

// ============ 创建模式的表单 Schema ============
const createMemorySchema = z.object({
  name: z.string().min(1, MEMORY_TEXTS.memories.nameRequired),
  avatar: z.string().optional(),
  memory_type: z
    .array(z.string())
    .min(1, MEMORY_TEXTS.memories.memoryTypeRequired)
    .refine((arr) => arr.includes('raw'), {
      message: MEMORY_TEXTS.memories.rawRequired,
    }),
  embd_id: z.string().min(1, MEMORY_TEXTS.memories.selectEmbeddingRequired),
  llm_id: z.string().min(1, MEMORY_TEXTS.memories.selectLlmRequired),
})

// ============ 编辑模式的表单 Schema（只有名称和头像） ============
const editMemorySchema = z.object({
  name: z.string().min(1, MEMORY_TEXTS.memories.nameRequired),
  avatar: z.string().optional(),
})

type CreateMemoryFormValues = z.infer<typeof createMemorySchema>
type EditMemoryFormValues = z.infer<typeof editMemorySchema>

interface CreateMemoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 创建时调用 */
  onCreate?: (data: CreateMemoryParams) => void
  /** 编辑时调用 */
  onUpdate?: (id: string, data: UpdateMemoryParams) => void
  isLoading?: boolean
  /** 编辑时传入的数据 */
  initialData?: Memory | null
}

export const CreateMemoryDialog: React.FC<CreateMemoryDialogProps> = ({
  open,
  onOpenChange,
  onCreate,
  onUpdate,
  isLoading = false,
  initialData,
}) => {
  const isEditMode = !!initialData

  // 生成渐变背景类
  const avatarGradient = React.useMemo(() => {
    const name = initialData?.name || 'M'
    const gradients = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
    ]
    const index = name.charCodeAt(0) % gradients.length
    return gradients[index]
  }, [initialData?.name])

  // ============ 创建模式表单 ============
  const createForm = useForm<CreateMemoryFormValues>({
    resolver: zodResolver(createMemorySchema),
    defaultValues: {
      name: '',
      avatar: '',
      memory_type: ['raw'],
      embd_id: '',
      llm_id: '',
    },
  })

  // ============ 编辑模式表单 ============
  const editForm = useForm<EditMemoryFormValues>({
    resolver: zodResolver(editMemorySchema),
    defaultValues: {
      name: initialData?.name || '',
      avatar: initialData?.avatar || '',
    },
  })

  // 当 initialData 变化时重置表单
  React.useEffect(() => {
    if (isEditMode && initialData) {
      editForm.reset({
        name: initialData.name,
        avatar: initialData.avatar || '',
      })
    } else {
      createForm.reset({
        name: '',
        avatar: '',
        memory_type: ['raw'],
        embd_id: '',
        llm_id: '',
      })
    }
  }, [initialData, isEditMode, createForm, editForm])

  // 创建提交
  const handleCreateSubmit = (values: CreateMemoryFormValues) => {
    onCreate?.({
      name: values.name,
      memory_type: values.memory_type,
      embd_id: values.embd_id,
      llm_id: values.llm_id,
      // avatar 需要单独处理，可能需要先上传再更新
    })
  }

  // 编辑提交
  const handleEditSubmit = (values: EditMemoryFormValues) => {
    if (initialData) {
      onUpdate?.(initialData.id, {
        name: values.name,
        avatar: values.avatar,
      })
    }
  }

  // ============ 编辑模式 UI ============
  if (isEditMode) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  'bg-gradient-to-br',
                  avatarGradient
                )}
              >
                <Brain className="h-5 w-5 text-white" />
              </div>
              <DialogTitle>{MEMORY_TEXTS.memories.editMemory}</DialogTitle>
            </div>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-6">
              {/* 头像 */}
              <FormField
                control={editForm.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <AvatarUpload
                      value={field.value}
                      onChange={field.onChange}
                      size="lg"
                      fallbackLetter={editForm.watch('name')?.charAt(0) || 'M'}
                      gradientClass={avatarGradient}
                      tips="支持 JPG、PNG，最大 5MB"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 名称 */}
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-text-secondary">
                      {MEMORY_TEXTS.memories.name}
                      <span className="text-status-error ml-0.5">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={MEMORY_TEXTS.memories.memoryNamePlaceholder}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <p className="text-xs text-text-tertiary text-center">
                更多配置请前往设置页面修改
              </p>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  {MEMORY_TEXTS.common.cancel}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {MEMORY_TEXTS.common.save}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    )
  }

  // ============ 创建模式 UI ============
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                'bg-gradient-to-br from-purple-500 to-pink-500'
              )}
            >
              <Brain className="h-5 w-5 text-white" />
            </div>
            <DialogTitle>{MEMORY_TEXTS.memories.createMemory}</DialogTitle>
          </div>
        </DialogHeader>

        <Form {...createForm}>
          <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-5">
            {/* 名称 */}
            <FormField
              control={createForm.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex items-start gap-4">
                  <div className="w-24 shrink-0 pt-2.5">
                    <div className="flex items-center gap-1.5">
                      <FormLabel className="text-text-secondary text-sm">
                        {MEMORY_TEXTS.memories.name}
                      </FormLabel>
                      <span className="text-status-error">*</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <FormControl>
                      <Input
                        placeholder={MEMORY_TEXTS.memories.memoryNamePlaceholder}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* 记忆类型 */}
            <FormField
              control={createForm.control}
              name="memory_type"
              render={({ field }) => (
                <FormItem className="flex items-start gap-4">
                  <div className="w-24 shrink-0 pt-2.5">
                    <div className="flex items-center gap-1.5">
                      <FormLabel className="text-text-secondary text-sm">
                        {MEMORY_TEXTS.memories.memoryType}
                      </FormLabel>
                      <span className="text-status-error">*</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-text-tertiary cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs whitespace-pre-line">
                            {MEMORY_TEXTS.memories.memoryTypeTooltip}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <div className="flex-1">
                    <FormControl>
                      <MemoryTypeSelect
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* 嵌入模型 */}
            <FormField
              control={createForm.control}
              name="embd_id"
              render={({ field }) => (
                <FormItem className="flex items-start gap-4">
                  <div className="w-24 shrink-0 pt-2.5">
                    <div className="flex items-center gap-1.5">
                      <FormLabel className="text-text-secondary text-sm">
                        {MEMORY_TEXTS.memories.embeddingModel}
                      </FormLabel>
                      <span className="text-status-error">*</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-text-tertiary cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            {MEMORY_TEXTS.memories.embeddingModelTooltip}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <div className="flex-1">
                    <FormControl>
                      <EmbeddingModelSelector
                        selectedModelId={field.value}
                        onSelect={(id) => field.onChange(id || '')}
                        showLabel={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* LLM 模型 */}
            <FormField
              control={createForm.control}
              name="llm_id"
              render={({ field }) => (
                <FormItem className="flex items-start gap-4">
                  <div className="w-24 shrink-0 pt-2.5">
                    <div className="flex items-center gap-1.5">
                      <FormLabel className="text-text-secondary text-sm">
                        {MEMORY_TEXTS.memories.llm}
                      </FormLabel>
                      <span className="text-status-error">*</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-text-tertiary cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            {MEMORY_TEXTS.memories.llmTooltip}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <div className="flex-1">
                    <FormControl>
                      <ChatModelSelector
                        selectedModelId={field.value}
                        onSelect={(id) => field.onChange(id || '')}
                        showLabel={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {MEMORY_TEXTS.common.cancel}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {MEMORY_TEXTS.common.create}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

CreateMemoryDialog.displayName = 'CreateMemoryDialog'
