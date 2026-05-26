/**
 * 解析方式单元格组件
 *
 * 显示文档的解析方式，悬停时显示阴影覆盖效果，点击后弹出配置弹窗
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Settings2 } from 'lucide-react'
import type { Document } from '@/types/api'
import {
  DocumentParserType,
  DOCUMENT_PARSER_TYPE_LABELS,
} from '@/types/document-parser'

interface ParserMethodCellProps {
  document: Document
  onShowChunkMethodModal: (doc: Document) => void
}

/**
 * 获取解析器的友好显示名称
 */
function getParserLabel(
  parserId: string | undefined,
  defaultLabel: string,
): string {
  if (!parserId) return defaultLabel
  if (parserId === 'naive') return 'General'
  return DOCUMENT_PARSER_TYPE_LABELS[parserId as DocumentParserType] || parserId
}

export const ParserMethodCell: React.FC<ParserMethodCellProps> = ({
  document,
  onShowChunkMethodModal,
}) => {
  const { t } = useTranslation()
  const parserLabel = getParserLabel(
    document.parser_id,
    t('knowledge.documents.defaultParser'),
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hover:shadow-elevation-low inline-flex cursor-pointer items-center rounded-sm px-2 py-1 transition-colors hover:bg-state-hover"
          aria-label={t('knowledge.documents.configureParser')}
        >
          <span className="max-w-[80px] truncate text-sm text-text-secondary">
            {parserLabel}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="left">
        <DropdownMenuItem onClick={() => onShowChunkMethodModal(document)}>
          <Settings2 className="mr-2 h-4 w-4" />
          {t('knowledge.documents.configureParser')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
