import React from 'react'
import { useTranslation } from 'react-i18next'
import { Code, Eye, Search, Star, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileIcon } from '@/components/ui/file-icon'
import { HighlightText } from '@/components/knowledge/HighlightText'

import type { RetrievalResultView } from './types'

interface ResultPreviewModalProps {
  result: RetrievalResultView | null
  highlightEnabled: boolean
  isMarkdownPreview: boolean
  onTogglePreview: () => void
  onClose: () => void
}

const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`

export const ResultPreviewModal: React.FC<ResultPreviewModalProps> = ({
  result,
  highlightEnabled,
  isMarkdownPreview,
  onTogglePreview,
  onClose,
}) => {
  const { t } = useTranslation()

  return (
    <Dialog
      open={!!result}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent size="xl" className="p-0">
        {result && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileIcon
                    fileName={result.doc.name}
                    fileType={result.doc.extension}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <DialogTitle>
                      {t('knowledge.search.previewTitle')}
                    </DialogTitle>
                    <DialogDescription className="truncate">
                      {result.doc.name}
                    </DialogDescription>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onTogglePreview}
                    className={`flex items-center gap-1 text-xs ${
                      isMarkdownPreview
                        ? 'border-border-accent bg-state-focus-subtle text-text-accent'
                        : ''
                    }`}
                  >
                    {isMarkdownPreview ? (
                      <>
                        <Code className="h-3 w-3" />
                        <span>{t('knowledge.search.raw')}</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" />
                        <span>{t('knowledge.search.preview')}</span>
                      </>
                    )}
                  </Button>
                  <Badge variant="warning" className="text-xs">
                    Beta
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 scrollbar-thin">
              {isMarkdownPreview ? (
                <div className="rounded-radius-md h-full w-full overflow-y-auto border border-border-default bg-background-subtle px-4 py-3 scrollbar-thin">
                  <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text-secondary">
                    {result.text}
                  </pre>
                </div>
              ) : (
                <div className="rounded-radius-md h-full w-full overflow-y-auto border border-border-default bg-background-subtle px-4 py-3 scrollbar-thin">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                    <HighlightText
                      html={result.highlight}
                      text={result.text}
                      enableHighlight={highlightEnabled}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border-default bg-background-subtle px-6 py-4">
              <div className="flex items-center justify-between text-sm text-text-secondary">
                <div className="flex items-center space-x-4">
                  <span>ID: {result.id}</span>
                  <span className="flex items-center">
                    <Star className="mr-1 h-3 w-3" />
                    {t('knowledge.search.similarity')}:{' '}
                    {formatPercent(result.scores.combined)}
                  </span>
                  <span className="flex items-center">
                    <Zap className="mr-1 h-3 w-3" />
                    {t('knowledge.search.vector')}:{' '}
                    {formatPercent(result.scores.vector)}
                  </span>
                  <span className="flex items-center">
                    <Search className="mr-1 h-3 w-3" />
                    {t('knowledge.search.text')}:{' '}
                    {formatPercent(result.scores.term)}
                  </span>
                </div>
                <div className="text-xs text-text-tertiary">
                  {t('knowledge.search.charsCount', {
                    count: result.text.length,
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
