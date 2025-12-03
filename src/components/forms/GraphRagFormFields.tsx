'use client'

import * as React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
import { GraphRagMethodOptions, DefaultEntityTypes } from '@/types/knowledge-form'

interface GraphRagFormFieldsProps {
  className?: string
}

// 实体类型编辑组件
function EntityTypesFormField({ name = 'parser_config.graphrag.entity_types' }: { name?: string }) {
  const form = useFormContext()
  const [inputValue, setInputValue] = React.useState('')

  const entityTypes: string[] = useWatch({
    control: form.control,
    name,
    defaultValue: DefaultEntityTypes,
  }) || []

  const handleAdd = () => {
    const trimmed = inputValue.trim().toLowerCase()
    if (trimmed && !entityTypes.includes(trimmed)) {
      form.setValue(name, [...entityTypes, trimmed])
      setInputValue('')
    }
  }

  const handleRemove = (type: string) => {
    form.setValue(name, entityTypes.filter((t) => t !== type))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <FormField
      control={form.control}
      name={name}
      render={() => (
        <FormItem className="flex items-start gap-1 space-y-0">
          <FormLabel
            required
            tooltip="指定要从文档中提取的实体类型，如：组织、人物、地点、事件等。"
            className="text-sm text-text-secondary w-1/4 shrink-0 pt-2"
          >
            实体类型
          </FormLabel>
          <div className="w-3/4 space-y-2">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入实体类型后按回车添加"
                className="h-9 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAdd}
                className="h-9 px-3"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {entityTypes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {entityTypes.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-primary/10 text-primary border border-primary/20"
                  >
                    {type}
                    <button
                      type="button"
                      onClick={() => handleRemove(type)}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}

export function GraphRagFormFields({ className }: GraphRagFormFieldsProps) {
  const form = useFormContext()

  const useGraphRag = useWatch({
    control: form.control,
    name: 'parser_config.graphrag.use_graphrag',
    defaultValue: false,
  })

  const methodOptions: SelectOptionGroup[] = GraphRagMethodOptions.map((opt) => ({
    label: opt.label,
    value: opt.value,
  }))

  return (
    <div className={cn('space-y-4', className)}>
      {/* 启用 GraphRAG */}
      <FormField
        control={form.control}
        name="parser_config.graphrag.use_graphrag"
        render={({ field }) => (
          <FormItem className="flex items-center gap-1 space-y-0">
            <FormLabel
              tooltip="基于知识库内所有切好的文本块构建知识图谱，用以提升多跳和复杂问题回答的正确率。请注意：构建知识图谱将消耗大量 token 和时间。"
              className="text-sm text-text-secondary w-1/4 shrink-0"
            >
              提取知识图谱
            </FormLabel>
            <div className="w-3/4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </div>
          </FormItem>
        )}
      />

      {useGraphRag && (
        <>
          {/* 实体类型 */}
          <EntityTypesFormField />

          {/* 方法选择 */}
          <FormField
            control={form.control}
            name="parser_config.graphrag.method"
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormLabel
                  tooltip={
                    <div>
                      <p><strong>Light</strong>: 实体和关系提取提示来自 LightRAG，简单快速的检索增强生成</p>
                      <p><strong>General</strong>: 实体和关系提取提示来自 Microsoft GraphRAG，基于图的模块化检索增强生成系统</p>
                    </div>
                  }
                  className="text-sm text-text-secondary w-1/4 shrink-0"
                >
                  方法
                </FormLabel>
                <div className="w-3/4">
                  <FormControl>
                    <SelectWithSearch
                      value={field.value}
                      onChange={field.onChange}
                      options={methodOptions}
                      placeholder="请选择方法"
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />

          {/* 实体归一化 */}
          <FormField
            control={form.control}
            name="parser_config.graphrag.resolution"
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormLabel
                  tooltip="解析过程会将具有相同含义的实体合并在一起，从而使知识图谱更简洁、更准确。例如：特朗普总统、唐纳德·特朗普、唐纳德·J·特朗普都应合并为同一实体。"
                  className="text-sm text-text-secondary w-1/4 shrink-0"
                >
                  实体归一化
                </FormLabel>
                <div className="w-3/4">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />

          {/* 社区报告生成 */}
          <FormField
            control={form.control}
            name="parser_config.graphrag.community"
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormLabel
                  tooltip="区块被聚集成层次化的社区，实体和关系通过更高抽象层次将每个部分连接起来。然后，我们使用 LLM 生成每个社区的摘要，称为社区报告。"
                  className="text-sm text-text-secondary w-1/4 shrink-0"
                >
                  社区报告生成
                </FormLabel>
                <div className="w-3/4">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  )
}

export default GraphRagFormFields
