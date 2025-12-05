'use client'

import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { SelectWithSearch, type SelectOptionGroup } from '@/components/ui/select-with-search'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'

export interface PipelineOption {
  id: string
  name: string
  avatar?: string
}

interface PipelineSelectProps {
  name?: string
  options?: PipelineOption[]
  showNavigateLink?: boolean
  horizontal?: boolean
  className?: string
}

export function PipelineSelect({
  name = 'pipeline_id',
  options = [],
  showNavigateLink = true,
  horizontal = true,
  className,
}: PipelineSelectProps) {
  const form = useFormContext()
  const navigate = useNavigate()

  const selectOptions: SelectOptionGroup[] = useMemo(() => {
    return options.map((opt) => ({
      label: opt.name,
      value: opt.id,
    }))
  }, [options])

  const handleNavigateToAgents = () => {
    navigate('/agents')
  }

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(horizontal && 'flex items-center gap-1 space-y-0', className)}>
          <FormLabel
            tooltip="选择一个已创建的数据管道来处理文档。数据管道可以自定义解析流程。"
            className={cn(
              'text-sm text-text-secondary',
              horizontal && 'w-1/4 shrink-0'
            )}
          >
            数据管道
          </FormLabel>
          <div className={cn(horizontal ? 'w-3/4' : 'w-full', 'space-y-2')}>
            {showNavigateLink && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNavigateToAgents}
                  className="text-sm text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
                >
                  从头创建
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <FormControl>
              <SelectWithSearch
                value={field.value}
                onChange={field.onChange}
                options={selectOptions}
                placeholder="请选择数据管道"
                emptyText="暂无可用的数据管道"
              />
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}

export default PipelineSelect


