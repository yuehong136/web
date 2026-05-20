import React, { useState } from 'react'
import { ChevronDown, ChevronRight, CircleDot } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MCPTool } from '@/types/mcp'

/**
 * MCP 工具项组件 — 可展开查看完整描述和参数详情
 */
export const ToolItem: React.FC<{ tool: MCPTool }> = ({ tool }) => {
  const [expanded, setExpanded] = useState(false)
  const paramKeys = tool.inputSchema?.properties
    ? Object.keys(tool.inputSchema.properties)
    : []
  const requiredKeys = tool.inputSchema?.required || []
  const hasDetails =
    paramKeys.length > 0 || (tool.description && tool.description.length > 80)

  return (
    <div>
      <button
        type="button"
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={cn(
          'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
          hasDetails
            ? 'cursor-pointer hover:bg-[var(--color-state-hover)]'
            : 'cursor-default',
        )}
      >
        {/* 展开/收起指示 */}
        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
          {hasDetails ? (
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
            )
          ) : (
            <CircleDot className="h-3 w-3 text-[var(--color-text-muted)]" />
          )}
        </div>

        {/* 工具信息 */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-medium text-[var(--color-text-primary)]">
              {tool.name}
            </span>
            {paramKeys.length > 0 && (
              <span className="text-xs tabular-nums text-[var(--color-text-muted)]">
                {paramKeys.length} 参数
              </span>
            )}
          </div>
          {tool.description && !expanded && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-text-tertiary)]">
              {tool.description}
            </p>
          )}
        </div>
      </button>

      {/* 展开区域：完整描述 + 参数表 */}
      {expanded && (
        <div className="space-y-3 px-4 pb-3 pl-11">
          {/* 完整描述 */}
          {tool.description && (
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--color-text-secondary)]">
              {tool.description}
            </p>
          )}

          {/* 参数表 */}
          {paramKeys.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background-subtle)]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)]">
                    <th className="px-3 py-1.5 text-left font-medium text-[var(--color-text-tertiary)]">
                      参数名
                    </th>
                    <th className="px-3 py-1.5 text-left font-medium text-[var(--color-text-tertiary)]">
                      类型
                    </th>
                    <th className="w-10 px-3 py-1.5 text-left font-medium text-[var(--color-text-tertiary)]">
                      必填
                    </th>
                    <th className="px-3 py-1.5 text-left font-medium text-[var(--color-text-tertiary)]">
                      说明
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {paramKeys.map((key) => {
                    const param = tool.inputSchema!.properties[key]
                    const isRequired = requiredKeys.includes(key)
                    return (
                      <tr key={key}>
                        <td className="whitespace-nowrap px-3 py-1.5 font-mono text-[var(--color-text-primary)]">
                          {key}
                        </td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-[var(--color-text-tertiary)]">
                          {param?.type || '-'}
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          {isRequired ? (
                            <span className="text-[var(--color-status-error)]">
                              *
                            </span>
                          ) : (
                            <span className="text-[var(--color-text-muted)]">
                              -
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-[var(--color-text-tertiary)]">
                          {param?.description || '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
