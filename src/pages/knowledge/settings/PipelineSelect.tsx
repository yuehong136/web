'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'
import { ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
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
  const { t } = useTranslation()
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
        <FormItem
          className={cn(
            horizontal && 'flex items-center gap-1 space-y-0',
            className,
          )}
        >
          <FormLabel
            tooltip={t('knowledge.settings.fields.pipelineTooltip')}
            className={cn(
              'text-sm text-text-secondary',
              horizontal && 'w-1/4 shrink-0',
            )}
          >
            {t('knowledge.settings.fields.pipeline')}
          </FormLabel>
          <div className={cn(horizontal ? 'w-3/4' : 'w-full', 'space-y-2')}>
            {showNavigateLink && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNavigateToAgents}
                  className="flex items-center gap-0.5 text-sm text-primary transition-colors hover:text-primary/80"
                >
                  {t('knowledge.settings.fields.createFromScratch')}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <FormControl>
              <SelectWithSearch
                value={field.value}
                onChange={field.onChange}
                options={selectOptions}
                placeholder={t('knowledge.settings.fields.pipelinePlaceholder')}
                emptyText={t('knowledge.settings.fields.pipelineEmpty')}
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
