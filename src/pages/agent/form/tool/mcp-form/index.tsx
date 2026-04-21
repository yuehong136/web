import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Form } from '@/components/ui/form'
import { useFetchMCPServerDetail } from '@/hooks/use-mcp-request'
import { FormWrapper } from '../../components'
import { McpCard } from '../../mcp-form/mcp-card'
import { useValues } from './use-values'
import { useWatchFormChange } from './use-watch-change'

const schema = z.object({
  items: z.array(z.string()).default([]),
})

interface McpFormProps {
  agentNodeId: string
  mcpIndex: number
  mcpId: string
  selectedTools?: Record<string, unknown>
}

export function McpForm({
  agentNodeId,
  mcpIndex,
  mcpId,
  selectedTools,
}: McpFormProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useFetchMCPServerDetail(mcpId, Boolean(mcpId))
  const values = useValues(selectedTools)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  const tools = useMemo(
    () => (data?.variables?.tools as Record<string, unknown>) || {},
    [data?.variables?.tools],
  )

  useWatchFormChange(form, {
    agentNodeId,
    mcpIndex,
    tools,
  })

  const watchedItems = useWatch({ control: form.control, name: 'items' })
  const items = useMemo(() => watchedItems || [], [watchedItems])
  const selectedSet = useMemo(() => new Set(items), [items])

  return (
    <Form {...form}>
      <FormWrapper>
        <div className="text-sm text-text-secondary">
          {t('flow.mcpSelect', 'Select MCP tools')}
        </div>
        <div className="space-y-2">
          {isLoading && (
            <div className="text-sm text-text-secondary">
              {t('flow.loading', 'Loading...')}
            </div>
          )}
          {!isLoading &&
            Object.entries(tools).map(([name, tool]) => (
              <McpCard
                key={name}
                server={{
                  id: `${mcpId}:${name}`,
                  name,
                  description:
                    (tool as { description?: string }).description || '',
                  server_type: '',
                  url: '',
                }}
                selected={selectedSet.has(name)}
                onToggle={() => {
                  const nextItems = selectedSet.has(name)
                    ? items.filter((value) => value !== name)
                    : [...items, name]
                  form.setValue('items', nextItems, { shouldDirty: true })
                }}
              />
            ))}
        </div>
      </FormWrapper>
    </Form>
  )
}
