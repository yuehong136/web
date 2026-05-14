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
        <div
          className="inline-flex cursor-pointer items-center rounded-sm px-2 py-1 transition-colors"
          style={{
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              'var(--color-state-hover, rgba(0, 0, 0, 0.05))'
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <span
            className="max-w-[80px] truncate text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {parserLabel}
          </span>
        </div>
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

export default ParserMethodCell
