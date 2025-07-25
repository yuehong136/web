import React from 'react'
import { Check, ChevronDown, FileText, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/tooltip'
import { DocumentParserType, DOCUMENT_PARSER_TYPE_LABELS, DOCUMENT_PARSER_TYPE_DESCRIPTIONS } from '@/types/document-parser'

interface ParserTypeSelectorProps {
  selectedParserId: string | null
  onSelect: (parserId: string | null) => void
}

export const ParserTypeSelector: React.FC<ParserTypeSelectorProps> = ({
  selectedParserId,
  onSelect
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 })
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const selectedParser = selectedParserId ? DOCUMENT_PARSER_TYPE_LABELS[selectedParserId as DocumentParserType] : null

  // 过滤解析器选项
  const filteredParsers = React.useMemo(() => {
    const entries = Object.entries(DOCUMENT_PARSER_TYPE_LABELS)
    if (!searchTerm) return entries
    
    return entries.filter(([key, label]) =>
      label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm])

  // 计算下拉框位置
  const updateDropdownPosition = React.useCallback(() => {
    if (triggerRef.current && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const dropdownHeight = 280 // 估计高度
      
      // 检查是否有足够空间在下方显示
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      
      let top = rect.bottom + window.scrollY
      
      // 如果下方空间不够且上方空间更多，则在上方显示
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        top = rect.top + window.scrollY - dropdownHeight
      }
      
      setDropdownPosition({
        top,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [isOpen])

  // 点击外部关闭和位置更新
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition()
      }
    }

    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition()
      }
    }

    if (isOpen) {
      updateDropdownPosition()
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('scroll', handleScroll, true)
      document.addEventListener('resize', handleResize)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('scroll', handleScroll, true)
      document.removeEventListener('resize', handleResize)
    }
  }, [isOpen, updateDropdownPosition])

  const handleSelect = (parserId: string | null) => {
    onSelect(parserId)
    setIsOpen(false)
    setSearchTerm('')
  }

  const getParserIcon = (parserType: string) => {
    const icons: Record<string, string> = {
      'naive': '📄',
      'qa': '❓',
      'resume': '👤',
      'manual': '✋',
      'table': '📊',
      'paper': '📖',
      'book': '📚',
      'laws': '⚖️',
      'presentation': '📊',
      'picture': '🖼️',
      'one': '📝',
      'audio': '🎵',
      'email': '📧',
      'tag': '🏷️',
      'knowledge_graph': '🕸️'
    }
    return icons[parserType] || '📄'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-1 mb-1">
        <label className="block text-xs font-medium text-gray-700">
          解析器类型
        </label>
        <Tooltip content="选择适合您文档类型的解析器，不同解析器适用于不同的文档格式">
          <HelpCircle className="h-3 w-3 text-gray-400 hover:text-gray-600" />
        </Tooltip>
      </div>
      
      {/* 选择器按钮 */}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full px-3 py-2 text-left border rounded-md bg-white transition-all duration-200 h-8 text-xs",
            "hover:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500",
            isOpen ? "border-blue-500 ring-1 ring-blue-500/20" : "border-gray-300"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {selectedParser ? (
                <>
                  <span className="text-sm">{getParserIcon(selectedParserId!)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate text-xs">
                      {selectedParser}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 text-xs">请选择解析器类型</div>
              )}
            </div>
            <ChevronDown 
              className={cn(
                "h-3 w-3 text-gray-400 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </button>

        {/* 下拉菜单 */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
            <div 
              ref={dropdownRef}
              className="fixed z-[9999] bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-hidden"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: Math.max(dropdownPosition.width, 320),
                minWidth: '320px'
              }}>
              {/* 搜索框 */}
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  placeholder="搜索解析器类型..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* 空选项 */}
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={cn(
                  "w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors duration-150 border-b border-gray-50 text-xs",
                  selectedParserId === null && "bg-blue-50 border-blue-100"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">🚫</span>
                    <div className="text-gray-900 font-medium">不选择解析器</div>
                  </div>
                  {selectedParserId === null && (
                    <Check className="h-3 w-3 text-blue-500" />
                  )}
                </div>
              </button>

              {/* 解析器选项列表 */}
              <div className="max-h-56 overflow-y-auto">
                {filteredParsers.length === 0 ? (
                  <div className="p-3 text-center text-gray-500 text-xs">
                    未找到匹配的解析器类型
                  </div>
                ) : (
                  filteredParsers.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleSelect(value)}
                      className={cn(
                        "w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors duration-150 border-b border-gray-50 last:border-b-0 text-xs",
                        selectedParserId === value && "bg-blue-50 border-blue-100"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <span className="text-sm">{getParserIcon(value)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {label}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {DOCUMENT_PARSER_TYPE_DESCRIPTIONS[value as DocumentParserType]?.substring(0, 40)}...
                            </div>
                          </div>
                          <div className="flex items-center">
                            <FileText className="h-3 w-3 text-green-500" />
                            {selectedParserId === value && (
                              <Check className="h-3 w-3 text-blue-500 ml-1" />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 选中解析器的描述 */}
      {selectedParserId && DOCUMENT_PARSER_TYPE_DESCRIPTIONS[selectedParserId as DocumentParserType] && (
        <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-200">
          <p className="text-xs text-blue-800 font-medium">
            {DOCUMENT_PARSER_TYPE_DESCRIPTIONS[selectedParserId as DocumentParserType]}
          </p>
        </div>
      )}
    </div>
  )
}