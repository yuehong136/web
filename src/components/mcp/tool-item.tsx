import { useId, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, Dot } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MCPTool } from '@/types/mcp'

interface ParameterSchema {
  type?: string
  description?: string
}

/**
 * One MCP tool: name and summary, expandable to the full description and a
 * parameter table. `actions` (for example "Run") sit at the end of the row.
 */
export function ToolItem({
  tool,
  actions,
}: {
  tool: MCPTool
  actions?: ReactNode
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const detailsId = useId()
  const properties = (tool.inputSchema?.properties ?? {}) as Record<
    string,
    ParameterSchema | undefined
  >
  const paramKeys = Object.keys(properties)
  const requiredKeys = tool.inputSchema?.required ?? []
  const hasDetails =
    paramKeys.length > 0 || (tool.description?.length ?? 0) > 80
  const Chevron = expanded ? ChevronDown : ChevronRight

  const summary = (
    <>
      <span className="flex size-icon-sm shrink-0 items-center justify-center text-fg-subtle">
        {hasDetails ? (
          <Chevron className="size-icon-sm" aria-hidden="true" />
        ) : (
          <Dot className="size-icon-sm" aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-space-sm">
          <span className="font-mono text-sm font-medium text-fg">
            {tool.name}
          </span>
          {paramKeys.length > 0 ? (
            <span className="text-xs text-fg-subtle tabular-nums">
              {t('mcp.tools.parameterCount', { count: paramKeys.length })}
            </span>
          ) : null}
        </span>
        {tool.description && !expanded ? (
          <span className="mt-space-2xs line-clamp-2 block text-xs text-fg-muted">
            {tool.description}
          </span>
        ) : null}
      </span>
    </>
  )

  return (
    <div className="border-t border-line-subtle first:border-t-0">
      <div className="flex items-start gap-space-sm py-space-sm">
        {hasDetails ? (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={detailsId}
            onClick={() => setExpanded(!expanded)}
            className="flex min-w-0 flex-1 items-start gap-space-sm rounded-radius-sm text-left outline-hidden focus-visible:ring-2 focus-visible:ring-line-focus"
          >
            {summary}
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-start gap-space-sm">
            {summary}
          </div>
        )}
        {actions ? (
          <div className="flex shrink-0 items-center gap-space-xs">
            {actions}
          </div>
        ) : null}
      </div>

      {expanded ? (
        <div
          id={detailsId}
          className="flex flex-col gap-space-sm pb-space-sm pl-space-lg"
        >
          {tool.description ? (
            <p className="text-xs whitespace-pre-wrap text-fg-muted">
              {tool.description}
            </p>
          ) : null}
          {paramKeys.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-line-subtle text-left text-fg-subtle">
                  <th className="py-space-2xs pr-space-sm font-medium">
                    {t('mcp.tools.parameter')}
                  </th>
                  <th className="py-space-2xs pr-space-sm font-medium">
                    {t('mcp.tools.type')}
                  </th>
                  <th className="py-space-2xs font-medium">
                    {t('mcp.tools.parameterDescription')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paramKeys.map((key) => (
                  <tr
                    key={key}
                    className="border-b border-line-subtle last:border-b-0"
                  >
                    <td className="py-space-2xs pr-space-sm font-mono whitespace-nowrap text-fg">
                      {key}
                      {requiredKeys.includes(key) ? (
                        <span className="ml-space-2xs text-danger-fg">
                          <span aria-hidden="true">*</span>
                          <span className="sr-only">
                            {t('mcp.tools.required')}
                          </span>
                        </span>
                      ) : null}
                    </td>
                    <td className="py-space-2xs pr-space-sm whitespace-nowrap text-fg-subtle">
                      {properties[key]?.type ?? '—'}
                    </td>
                    <td
                      className={cn(
                        'py-space-2xs text-fg-muted',
                        !properties[key]?.description && 'text-fg-subtle',
                      )}
                    >
                      {properties[key]?.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
