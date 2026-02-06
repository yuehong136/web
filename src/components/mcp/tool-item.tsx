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
  const hasDetails = paramKeys.length > 0 || (tool.description && tool.description.length > 80)

  return (
    <div>
      <button
        type="button"
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={cn(
          "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors",
          hasDetails
            ? "cursor-pointer hover:bg-[var(--color-state-hover)]"
            : "cursor-default"
        )}
      >
        {/* 展开/收起指示 */}
        <div className="shrink-0 w-4 h-4 flex items-center justify-center mt-0.5">
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-medium text-[var(--color-text-primary)]">
              {tool.name}
            </span>
            {paramKeys.length > 0 && (
              <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
                {paramKeys.length} 参数
              </span>
            )}
          </div>
          {tool.description && !expanded && (
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1 line-clamp-2 leading-relaxed">
              {tool.description}
            </p>
          )}
        </div>
      </button>

      {/* 展开区域：完整描述 + 参数表 */}
      {expanded && (
        <div className="px-4 pb-3 pl-11 space-y-3">
          {/* 完整描述 */}
          {tool.description && (
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
              {tool.description}
            </p>
          )}

          {/* 参数表 */}
          {paramKeys.length > 0 && (
            <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background-subtle)] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)]">
                    <th className="text-left px-3 py-1.5 font-medium text-[var(--color-text-tertiary)]">参数名</th>
                    <th className="text-left px-3 py-1.5 font-medium text-[var(--color-text-tertiary)]">类型</th>
                    <th className="text-left px-3 py-1.5 font-medium text-[var(--color-text-tertiary)] w-10">必填</th>
                    <th className="text-left px-3 py-1.5 font-medium text-[var(--color-text-tertiary)]">说明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {paramKeys.map((key) => {
                    const param = tool.inputSchema!.properties[key]
                    const isRequired = requiredKeys.includes(key)
                    return (
                      <tr key={key}>
                        <td className="px-3 py-1.5 font-mono text-[var(--color-text-primary)] whitespace-nowrap">{key}</td>
                        <td className="px-3 py-1.5 text-[var(--color-text-tertiary)] whitespace-nowrap">{param?.type || '-'}</td>
                        <td className="px-3 py-1.5 text-center">
                          {isRequired ? (
                            <span className="text-[var(--color-state-error)]">*</span>
                          ) : (
                            <span className="text-[var(--color-text-muted)]">-</span>
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
