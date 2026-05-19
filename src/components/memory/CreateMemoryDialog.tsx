/**
 * Create/edit memory dialog.
 *
 * Create mode shows all fields; edit mode only changes name and avatar.
 */

import { useEffect, useMemo, type FC } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Brain, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { FormTooltip } from '@/components/ui/tooltip'
import { MemoryTypeSelect } from './MemoryTypeSelect'
import { ChatModelSelector } from './ChatModelSelector'
import { AvatarUpload } from './AvatarUpload'
import { EmbeddingModelSelector } from '@/components/knowledge/EmbeddingModelSelector'
import { cn } from '@/lib/utils'
import { useModelStore } from '@/stores/model'
import { MEMORY_TEXTS } from '@/constants/memory-texts'
import type {
  Memory,
  CreateMemoryParams,
  UpdateMemoryParams,
} from '@/types/memory'

// ============ Create form schema ============
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

// ============ Edit form schema ============
const editMemorySchema = z.object({
  name: z.string().min(1, MEMORY_TEXTS.memories.nameRequired),
  avatar: z.string().optional(),
})

type CreateMemoryFormValues = z.infer<typeof createMemorySchema>
type EditMemoryFormValues = z.infer<typeof editMemorySchema>

interface CreateMemoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate?: (data: CreateMemoryParams) => void
  onUpdate?: (id: string, data: UpdateMemoryParams) => void
  isLoading?: boolean
  initialData?: Memory | null
}

export const CreateMemoryDialog: FC<CreateMemoryDialogProps> = ({
  open,
  onOpenChange,
  onCreate,
  onUpdate,
  isLoading = false,
  initialData,
}) => {
  const isEditMode = !!initialData
  const modelProviders = useModelStore((state) => state.myLLMs)
  const isLoadingModels = useModelStore((state) => state.isLoading)
  const loadMyLLMs = useModelStore((state) => state.loadMyLLMs)

  const avatarGradient = useMemo(() => {
    const name = initialData?.name || 'M'
    const gradients = [
      'from-components-avatar-gradient-purple-from to-components-avatar-gradient-purple-to',
      'from-components-avatar-gradient-blue-from to-components-avatar-gradient-blue-to',
      'from-components-avatar-gradient-green-from to-components-avatar-gradient-green-to',
      'from-components-avatar-gradient-orange-from to-components-avatar-gradient-orange-to',
      'from-components-avatar-gradient-indigo-from to-components-avatar-gradient-indigo-to',
    ]
    const index = name.charCodeAt(0) % gradients.length
    return gradients[index]
  }, [initialData?.name])

  useEffect(() => {
    if (Object.keys(modelProviders).length === 0) {
      void loadMyLLMs()
    }
  }, [loadMyLLMs, modelProviders])

  // ============ Create form ============
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

  // ============ Edit form ============
  const editForm = useForm<EditMemoryFormValues>({
    resolver: zodResolver(editMemorySchema),
    defaultValues: {
      name: initialData?.name || '',
      avatar: initialData?.avatar || '',
    },
  })

  useEffect(() => {
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

  const handleCreateSubmit = (values: CreateMemoryFormValues) => {
    onCreate?.({
      name: values.name,
      memory_type: values.memory_type,
      embd_id: values.embd_id,
      llm_id: values.llm_id,
    })
  }

  const handleEditSubmit = (values: EditMemoryFormValues) => {
    if (initialData) {
      onUpdate?.(initialData.id, {
        name: values.name,
        avatar: values.avatar,
      })
    }
  }

  // ============ Edit mode UI ============
  if (isEditMode) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="sm">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'rounded-radius-lg flex h-10 w-10 items-center justify-center',
                  'bg-gradient-to-br',
                  avatarGradient,
                )}
              >
                <Brain className="w-icon-md h-icon-md text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle>{MEMORY_TEXTS.memories.editMemory}</DialogTitle>
                <DialogDescription>
                  {MEMORY_TEXTS.memories.editMemoryDescription}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)}>
              <div className="space-y-5 px-6 py-4">
                <FormField
                  control={editForm.control}
                  name="avatar"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center">
                      <AvatarUpload
                        value={field.value}
                        onChange={field.onChange}
                        size="lg"
                        fallbackLetter={
                          editForm.watch('name')?.charAt(0) || 'M'
                        }
                        gradientClass={avatarGradient}
                        tips={MEMORY_TEXTS.memories.avatarUploadTips}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-[var(--color-text-primary)]">
                        {MEMORY_TEXTS.memories.name}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            MEMORY_TEXTS.memories.memoryNamePlaceholder
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <p className="text-center text-xs text-[var(--color-text-tertiary)]">
                  {MEMORY_TEXTS.memories.editSettingsTip}
                </p>
              </div>

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
                  {isLoading && (
                    <Loader2 className="w-icon-sm h-icon-sm mr-space-sm animate-spin" />
                  )}
                  {MEMORY_TEXTS.common.save}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    )
  }

  // ============ Create mode UI ============
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'rounded-radius-lg flex h-10 w-10 items-center justify-center',
                'bg-gradient-to-br from-components-avatar-gradient-purple-from to-components-avatar-gradient-purple-to',
              )}
            >
              <Brain className="w-icon-md h-icon-md text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle>{MEMORY_TEXTS.memories.createMemory}</DialogTitle>
              <DialogDescription>
                {MEMORY_TEXTS.memories.createMemoryDescription}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...createForm}>
          <form onSubmit={createForm.handleSubmit(handleCreateSubmit)}>
            <div className="max-h-[calc(80vh-200px)] space-y-5 overflow-y-auto px-6 py-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-[var(--color-text-primary)]">
                      {MEMORY_TEXTS.memories.name}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          MEMORY_TEXTS.memories.memoryNamePlaceholder
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="memory_type"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel className="text-sm font-medium text-[var(--color-text-primary)]">
                        {MEMORY_TEXTS.memories.memoryType}
                      </FormLabel>
                      <FormTooltip
                        tooltip={MEMORY_TEXTS.memories.memoryTypeTooltip}
                      />
                    </div>
                    <FormControl>
                      <MemoryTypeSelect
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="embd_id"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel className="text-sm font-medium text-[var(--color-text-primary)]">
                        {MEMORY_TEXTS.memories.embeddingModel}
                      </FormLabel>
                      <FormTooltip
                        tooltip={MEMORY_TEXTS.memories.embeddingModelTooltip}
                      />
                    </div>
                    <FormControl>
                      <EmbeddingModelSelector
                        isLoadingModels={isLoadingModels}
                        modelProviders={modelProviders}
                        selectedModelId={field.value}
                        onSelect={(id) => field.onChange(id || '')}
                        showLabel={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="llm_id"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel className="text-sm font-medium text-[var(--color-text-primary)]">
                        {MEMORY_TEXTS.memories.llm}
                      </FormLabel>
                      <FormTooltip tooltip={MEMORY_TEXTS.memories.llmTooltip} />
                    </div>
                    <FormControl>
                      <ChatModelSelector
                        selectedModelId={field.value}
                        onSelect={(id) => field.onChange(id || '')}
                        showLabel={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {isLoading && (
                  <Loader2 className="w-icon-sm h-icon-sm mr-space-sm animate-spin" />
                )}
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
