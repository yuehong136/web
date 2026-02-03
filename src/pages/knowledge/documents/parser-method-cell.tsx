/**
 * 解析方式单元格组件
 *
 * 显示文档的解析方式，悬停时显示阴影覆盖效果，点击后弹出配置弹窗
 */

import React from 'react'
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
function getParserLabel(parserId: string | undefined): string {
  if (!parserId) return '默认'
  if (parserId === 'naive') return 'General'
  return DOCUMENT_PARSER_TYPE_LABELS[parserId as DocumentParserType] || parserId
}

export const ParserMethodCell: React.FC<ParserMethodCellProps> = ({
  document,
  onShowChunkMethodModal,
}) => {
  const parserLabel = getParserLabel(document.parser_id)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className="cursor-pointer px-2 py-1 rounded-sm transition-colors inline-flex items-center"
          style={{
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              'var(--color-state-hover, rgba(0, 0, 0, 0.05))'
            e.currentTarget.style.boxShadow =
              '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <span
            className="text-sm truncate max-w-[80px]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {parserLabel}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="left">
        <DropdownMenuItem onClick={() => onShowChunkMethodModal(document)}>
          <Settings2 className="h-4 w-4 mr-2" />
          配置解析方式
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ParserMethodCell
