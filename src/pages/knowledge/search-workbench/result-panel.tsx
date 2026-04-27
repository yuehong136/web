import React from 'react'
import { ChevronDown, ChevronUp, FileText, Loader2, Search, Star } from 'lucide-react'

import { HighlightText } from '@/components/knowledge/HighlightText'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FileIcon } from '@/components/ui/file-icon'
import { PageSizeSelector } from '@/components/ui/page-size-selector'
import { Tooltip } from '@/components/ui/tooltip'

import type { RetrievalDocAgg, RetrievalResult } from './types'

interface ResultPanelProps {
  query: string
  isSearching: boolean
  results: RetrievalResult[]
  totalResults: number
  docAggs: RetrievalDocAgg[]
  selectedDocIds: string[]
  showDocFilter: boolean
  highlight: boolean
  similarityThreshold: number
  currentPage: number
  pageSize: number
  totalPages: number
  pageNumbers: number[]
  onToggleDocFilter: () => void
  onDocFilter: (docId: string, checked: boolean) => void
  onClearDocFilter: () => void
  onSelectAllDocs: () => void
  onOpenResultPreview: (result: RetrievalResult) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  query,
  isSearching,
  results,
  totalResults,
  docAggs,
  selectedDocIds,
  showDocFilter,
  highlight,
  similarityThreshold,
  currentPage,
  pageSize,
  totalPages,
  pageNumbers,
  onToggleDocFilter,
  onDocFilter,
  onClearDocFilter,
  onSelectAllDocs,
  onOpenResultPreview,
  onPageChange,
  onPageSizeChange,
}) => {
  return (
    <section className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden pl-space-xl">
      <div className="pb-space-base">
        <div className="flex flex-wrap items-start justify-between gap-space-base">
          <div className="min-w-0">
            <div className="flex items-center gap-space-sm">
              <FileText className="h-5 w-5 text-text-secondary" />
              <h2 className="text-base font-semibold text-text-primary">检索结果</h2>
            </div>
            <div className="mt-space-xs flex flex-wrap items-center gap-space-sm text-sm text-text-secondary">
              <span>{isSearching ? '检索中...' : `找到 ${totalResults} 个相关片段`}</span>
              {selectedDocIds.length > 0 && (
                <Badge variant="blue" className="text-xs">
                  已过滤 {selectedDocIds.length} 个文档
                </Badge>
              )}
              {docAggs.length > 0 && (
                <>
                  <span className="text-text-tertiary">来源</span>
                  {docAggs.slice(0, 3).map((doc) => (
                    <Tooltip key={doc.doc_id} content={`${doc.doc_name}: ${doc.count} 个片段`}>
                      <Badge variant="secondary" className="max-w-[160px] truncate text-xs">
                        {doc.doc_name}
                      </Badge>
                    </Tooltip>
                  ))}
                  {docAggs.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{docAggs.length - 3} 个文档
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {docAggs.length > 0 && (
          <div className="mt-space-base border-t border-border-default pt-space-base">
            <div className="flex flex-wrap items-center justify-between gap-space-sm">
              <button
                onClick={onToggleDocFilter}
                className="flex items-center gap-space-xs text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                <FileText className="h-4 w-4" />
                <span>文档过滤</span>
                {selectedDocIds.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedDocIds.length}
                  </Badge>
                )}
                {showDocFilter ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              <div className="flex items-center gap-space-sm">
                {selectedDocIds.length > 0 && (
                  <>
                    <span className="text-xs text-text-tertiary">
                      已选择 {selectedDocIds.length} 个文档
                    </span>
                    <button
                      onClick={onClearDocFilter}
                      className="text-xs text-text-secondary hover:text-text-primary"
                    >
                      清除
                    </button>
                  </>
                )}
                <button
                  onClick={onSelectAllDocs}
                  className="rounded-radius-full border border-border-accent px-space-sm py-space-xs text-xs text-text-accent transition-colors hover:bg-background-subtle"
                >
                  全部
                </button>
              </div>
            </div>

            {showDocFilter && (
              <div className="mt-space-sm flex flex-wrap gap-space-xs">
                {docAggs.map((doc) => (
                  <label
                    key={doc.doc_id}
                    className="flex cursor-pointer items-center gap-space-xs rounded-radius-full border border-border-default bg-background-subtle px-space-sm py-space-xs transition-colors hover:bg-components-card-bg-hover"
                  >
                    <Checkbox
                      checked={selectedDocIds.includes(doc.doc_id)}
                      onCheckedChange={(checked) => onDocFilter(doc.doc_id, checked as boolean)}
                    />
                    <span className="max-w-[220px] truncate text-sm text-text-secondary">
                      {doc.doc_name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {doc.count}
                    </Badge>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-space-lg scrollbar-thin">
        {!query ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Search className="mx-auto mb-space-base h-12 w-12 text-text-muted" />
              <h3 className="mb-space-xs text-lg font-medium text-text-primary">开始检索测试</h3>
              <p className="text-text-tertiary">在左侧输入问题，选择检索模式，开始测试知识库的检索效果</p>
            </div>
          </div>
        ) : isSearching ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto mb-space-base h-8 w-8 animate-spin text-text-accent" />
              <p className="text-text-secondary">正在检索中，请稍候...</p>
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Search className="mx-auto mb-space-base h-8 w-8 text-text-muted" />
              <h3 className="mb-space-xs text-lg font-medium text-text-primary">未找到相关结果</h3>
              <p className="mb-space-base text-text-tertiary">请尝试调整搜索词或降低相似度阈值</p>
              <div className="text-sm text-text-tertiary">
                <p>搜索词："{query}"</p>
                <p>相似度阈值：{similarityThreshold}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-space-base">
            {results.map((result, index) => (
              <RetrievalResultCard
                key={result.chunk_id}
                result={result}
                order={(currentPage - 1) * pageSize + index + 1}
                highlight={highlight}
                onOpen={() => onOpenResultPreview(result)}
              />
            ))}
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="border-t border-border-default bg-background-surface px-space-base py-space-sm">
          <div className="flex flex-wrap items-center justify-between gap-space-base">
            <div className="text-sm text-text-secondary">共 {totalResults} 个结果</div>

            <div className="flex flex-wrap items-center gap-space-base">
              <PageSizeSelector
                pageSize={pageSize}
                onChange={onPageSizeChange}
                options={[10, 20, 50, 100]}
              />

              <div className="flex items-center gap-space-xs">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  上一页
                </Button>

                <div className="flex items-center gap-space-xs">
                  {pageNumbers.map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      className="min-w-[32px]"
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

interface RetrievalResultCardProps {
  result: RetrievalResult
  order: number
  highlight: boolean
  onOpen: () => void
}

const RetrievalResultCard: React.FC<RetrievalResultCardProps> = ({
  result,
  order,
  highlight,
  onOpen,
}) => {
  const hasMore = result.text.length > 200 || Boolean(result.highlight && result.highlight.length > 200)

  return (
    <article className="rounded-radius-lg border border-border-default bg-background-surface p-space-base transition-colors hover:bg-components-card-bg-hover">
        <div className="mb-space-base flex flex-wrap items-start justify-between gap-space-base">
          <div className="flex min-w-0 items-center gap-space-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-radius-full bg-state-success-subtle text-sm font-semibold text-text-success">
              {order}
            </div>
            <p className="truncate text-xs text-text-tertiary">ID: {result.chunk_id}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-space-xs">
            <Tooltip content={`综合相似度: ${(result.similarity * 100).toFixed(1)}%`}>
              <Badge variant="blue" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                综合 {(result.similarity * 100).toFixed(1)}%
              </Badge>
            </Tooltip>
            <Badge variant="green" className="text-xs">
              向量 {(result.vector_similarity * 100).toFixed(1)}%
            </Badge>
            <Badge variant="purple" className="text-xs">
              文本 {(result.term_similarity * 100).toFixed(1)}%
            </Badge>
          </div>
        </div>

        <button
          type="button"
          className="mb-space-base block w-full rounded-radius-md p-space-xs text-left text-sm leading-relaxed text-text-secondary transition-colors hover:bg-background-subtle"
          onClick={onOpen}
        >
          <HighlightText
            html={result.highlight}
            text={result.text}
            enableHighlight={highlight}
            truncate
            truncateLength={200}
          />
          {hasMore && (
            <span className="mt-space-xs inline-flex text-xs font-medium text-text-accent">
              展开
            </span>
          )}
        </button>

        <div className="border-t border-border-default pt-space-sm">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex min-w-0 items-center gap-space-sm">
              <FileIcon
                fileName={result.docnm_kwd}
                fileType={result.docnm_kwd.split('.').pop() || 'txt'}
                size="sm"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-text-secondary">
                  {result.docnm_kwd}
                </div>
                <div className="mt-1 text-xs text-text-tertiary">来自文档</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-xs" onClick={onOpen}>
              <FileText className="h-3 w-3 mr-1" />
              详情
            </Button>
          </div>
        </div>
    </article>
  )
}
