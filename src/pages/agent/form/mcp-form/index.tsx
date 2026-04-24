import { Form } from '@/components/ui/form'
import { useFetchMCPServers } from '@/hooks/use-mcp-request'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper } from '../components'
import { McpCard } from './mcp-card'

const schema = z.object({
  mcp: z.array(z.string()).optional(),
})

const defaultValues = {
  mcp: [] as string[],
}

export function McpForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(defaultValues, node)
  const { data, isLoading } = useFetchMCPServers({ page_size: 200 })

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- || [] fallback 由下方 useMemo 封装，引用差异不影响渲染正确性
  const selected = useWatch({ control: form.control, name: 'mcp' }) || []
  const servers = data?.mcp_servers || []

  const selectedSet = useMemo(() => new Set(selected), [selected])

  const handleToggle = (id: string) => {
    const next = selectedSet.has(id)
      ? selected.filter((item: string) => item !== id)
      : [...selected, id]
    form.setValue('mcp', next, { shouldDirty: true })
  }

  return (
    <Form {...form}>
      <FormWrapper>
        <div className="text-sm text-text-secondary">
          {t('flow.mcpSelect', 'Select MCP servers')}
        </div>
        <div className="space-y-2">
          {isLoading && (
            <div className="text-sm text-text-secondary">
              {t('flow.loading', 'Loading...')}
            </div>
          )}
          {!isLoading && servers.length === 0 && (
            <div className="text-sm text-text-secondary">
              {t('flow.noMcpServers', 'No MCP servers')}
            </div>
          )}
          {servers.map((server) => (
            <McpCard
              key={server.id}
              server={server}
              selected={selectedSet.has(server.id)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </FormWrapper>
    </Form>
  )
}
