import React, { memo } from 'react'
import { ClipboardList, Lightbulb, Sparkles } from 'lucide-react'
import SearchComposer from './search-composer'

interface SearchStarterViewProps {
  isSearching: boolean
  prefillText: string
  prefillVersion: number
  onSearch: (query: string) => void
  onStop: () => void
  onPrefill: (query: string) => void
}

const STARTER_PROMPTS = [
  {
    title: '总结某个主题',
    description: '提炼核心结论与证据来源',
    query: '请基于当前知识库，总结这套资料最核心的 5 个结论，并给出引用依据。',
    icon: ClipboardList,
  },
  {
    title: '定位关键信息',
    description: '快速找出关键段落与原文',
    query: '请找出与“系统架构与性能瓶颈”最相关的文档片段，并按重要性排序。',
    icon: Lightbulb,
  },
  {
    title: '多文档对比',
    description: '比较异同并给出建议',
    query: '请对比不同文档在功能设计上的差异，并输出可执行的改进建议。',
    icon: Sparkles,
  },
] as const

const SearchStarterView: React.FC<SearchStarterViewProps> = ({
  isSearching,
  prefillText,
  prefillVersion,
  onSearch,
  onStop,
  onPrefill,
}) => {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="relative w-full max-w-5xl">
        <div className="mb-space-2xl text-center">
          <p
            className="bg-clip-text text-2xl font-semibold tracking-tight text-transparent"
            style={{
              backgroundImage:
                'linear-gradient(90deg, var(--color-text-accent), var(--color-status-info))',
            }}
          >
            AI SEARCH
          </p>
          <h3 className="mt-space-sm text-3xl font-semibold tracking-tight text-text-primary">
            开始一次深度检索
          </h3>
          <p className="mt-space-base text-base text-text-secondary">
            融合知识检索、证据引用与结构化总结，快速产出高质量答案。
          </p>
        </div>

        <div className="mt-space-xl rounded-radius-xl p-space-xl mx-auto w-full max-w-4xl border border-border-default bg-components-card-bg">
          <SearchComposer
            variant="hero"
            onSearch={onSearch}
            onStop={onStop}
            isSearching={isSearching}
            prefillText={prefillText}
            prefillVersion={prefillVersion}
          />
        </div>

        <div className="mt-space-2xl gap-space-xl grid grid-cols-1 md:grid-cols-3">
          {STARTER_PROMPTS.map((prompt) => {
            const Icon = prompt.icon
            return (
              <button
                key={prompt.title}
                type="button"
                onClick={() => onPrefill(prompt.query)}
                className="rounded-radius-xl bg-surface-primary p-space-lg group border border-border-default text-left transition-all duration-200 hover:border-border-accent hover:bg-[var(--color-state-focus-10)]"
              >
                <span className="rounded-radius-lg bg-surface-secondary inline-flex h-10 w-10 items-center justify-center text-text-accent transition-colors group-hover:bg-[var(--color-state-focus-10)] group-hover:text-text-accent">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-space-sm text-base font-medium text-text-primary group-hover:text-text-accent">
                  {prompt.title}
                </p>
                <p className="mt-space-xs text-xs leading-relaxed text-text-secondary">
                  {prompt.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default memo(SearchStarterView)
