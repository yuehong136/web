'use client'

import * as React from 'react'
import { useFormContext } from 'react-hook-form'
import { Upload, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import type { SelectOptionGroup } from '@/components/ui/select-with-search'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import {
  PermissionFormField,
  EmbeddingModelFormField,
  PageRankFormField,
} from '@/components/forms/KnowledgeFormFields'
import { TagSetItem } from './tag-item'

interface GeneralFormProps {
  embeddingModelOptions: SelectOptionGroup[]
  embeddingModelLoading?: boolean
  embeddingModelDisabled?: boolean
  className?: string
}

export function GeneralForm({
  embeddingModelOptions,
  embeddingModelLoading = false,
  embeddingModelDisabled = false,
  className,
}: GeneralFormProps) {
  const form = useFormContext()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // 处理头像上传
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        form.setValue('avatar', result)
      }
      reader.readAsDataURL(file)
    }
  }

  const avatarValue = form.watch('avatar')
  const nameValue = form.watch('name')

  return (
    <div className={cn('space-y-5', className)}>
      {/* 头像上传 */}
      <FormField
        control={form.control}
        name="avatar"
        render={() => (
          <FormItem className="flex items-center gap-1 space-y-0">
            <FormLabel className="text-sm text-text-secondary w-1/4 shrink-0">
              知识库头像
            </FormLabel>
            <div className="w-3/4 flex items-center gap-4">
              <Avatar className="h-12 w-12 ring-2 ring-border">
                <AvatarImage src={avatarValue || undefined} alt={nameValue} />
                <AvatarFallback><Database className="h-6 w-6 text-text-tertiary" /></AvatarFallback>
              </Avatar>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5"
                >
                  <Upload className="h-4 w-4" />
                  上传头像
                </Button>
                <p className="text-xs text-text-tertiary mt-1.5">
                  支持 JPG, PNG 格式，建议尺寸 128x128 像素
                </p>
              </div>
            </div>
          </FormItem>
        )}
      />

      {/* 知识库名称 */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem className="flex items-center gap-1 space-y-0">
            <FormLabel
              required
              className="text-sm text-text-secondary w-1/4 shrink-0"
            >
              知识库名称
            </FormLabel>
            <div className="w-3/4">
              <FormControl>
                <Input
                  {...field}
                  placeholder="请输入知识库名称"
                  className="h-9"
                />
              </FormControl>
              <FormMessage className="mt-1" />
            </div>
          </FormItem>
        )}
      />

      {/* 访问权限 */}
      <PermissionFormField />

      {/* 描述信息 */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem className="flex items-start gap-1 space-y-0">
            <FormLabel className="text-sm text-text-secondary w-1/4 shrink-0 pt-2">
              描述信息
            </FormLabel>
            <div className="w-3/4">
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="请输入知识库描述"
                  rows={3}
                  className="resize-none"
                />
              </FormControl>
              <FormMessage className="mt-1" />
            </div>
          </FormItem>
        )}
      />

      {/* 嵌入模型 */}
      <EmbeddingModelFormField
        options={embeddingModelOptions}
        loading={embeddingModelLoading}
        disabled={embeddingModelDisabled}
      />

      {/* PageRank 权重 */}
      <PageRankFormField />

      {/* 标签集 */}
      <TagSetItem />
    </div>
  )
}

export default GeneralForm
