import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mcpAPI } from '@/api/mcp'
import { useDialogApps } from '@/hooks/use-dialog-apps'
import { toast } from '@/lib/toast'
import { SkillList } from './SkillList'
import { AppList } from './AppList'
import type { MCPServer } from '@/types/mcp'
import type { DialogApp } from '@/types/api'

interface SkillPanelProps {
  open: boolean
  onClose: () => void
  onSelectSkill: (server: MCPServer) => void
  onSelectApp: (app: DialogApp, conversationId?: string | null) => void
  onStartNewConversation: () => void
  selectedSkillIds: string[]
  selectedAppIds: string[]
  anchorRef: React.RefObject<HTMLElement>
  /** 面板弹出方向：down=向下弹出，up=向上弹出 */
  direction: 'up' | 'down'
}

export const SkillPanel: React.FC<SkillPanelProps> = ({
  open,
  onClose,
  onSelectSkill,
  onSelectApp,
  onStartNewConversation,
  selectedSkillIds,
  selectedAppIds,
  anchorRef,
  direction,
}) => {
  const [activeTab, setActiveTab] = useState<'skill' | 'app'>('skill')
  const [servers, setServers] = useState<MCPServer[]>([])
  const [skillLoading, setSkillLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  // 获取对话应用列表
  const { data: dialogApps = [], isLoading: appsLoading } = useDialogApps()

  // 加载 MCP 服务器列表
  useEffect(() => {
    if (open && activeTab === 'skill') {
      loadServers()
    }
  }, [open, activeTab])

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, onClose, anchorRef])

  // 切换标签时清空搜索
  useEffect(() => {
    setSearchTerm('')
  }, [activeTab])

  const loadServers = async () => {
    try {
      setSkillLoading(true)
      const response = await mcpAPI.listServers({}, { page: 1, page_size: 100 })
      setServers(response.mcp_servers || [])
    } catch (error) {
      toast.error('加载技能列表失败')
      console.error('Load MCP servers error:', error)
    } finally {
      setSkillLoading(false)
    }
  }

  // 过滤后的技能列表
  const filteredServers = useMemo(() => {
    if (!searchTerm) return servers
    const term = searchTerm.toLowerCase()
    return servers.filter(
      (server) =>
        server.name.toLowerCase().includes(term) ||
        server.description?.toLowerCase().includes(term)
    )
  }, [servers, searchTerm])

  // 过滤后的应用列表（只显示已激活的应用）
  const filteredApps = useMemo(() => {
    const activeApps = dialogApps.filter(app => app.status === '1')
    if (!searchTerm) return activeApps
    const term = searchTerm.toLowerCase()
    return activeApps.filter(
      (app) =>
        app.name.toLowerCase().includes(term) ||
        app.description?.toLowerCase().includes(term)
    )
  }, [dialogApps, searchTerm])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className={cn(
        "absolute left-0 w-80 bg-components-card-bg rounded-xl border border-border-default shadow-lg overflow-hidden z-50",
        direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
      )}
      style={{
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
      }}
    >
      {/* 搜索框 */}
      <div className="p-3 border-b border-border-default">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="搜索技能/应用"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background-subtle rounded-lg border-none outline-none placeholder:text-text-tertiary text-text-primary"
            autoFocus
          />
        </div>
      </div>

      {/* 标签切换 */}
      <div className="flex border-b border-border-default">
        <button
          onClick={() => setActiveTab('skill')}
          className={cn(
            'flex-1 py-2.5 text-sm font-medium transition-colors',
            activeTab === 'skill'
              ? 'text-text-primary border-b-2 border-text-primary'
              : 'text-text-tertiary hover:text-text-secondary'
          )}
        >
          技能
        </button>
        <button
          onClick={() => setActiveTab('app')}
          className={cn(
            'flex-1 py-2.5 text-sm font-medium transition-colors',
            activeTab === 'app'
              ? 'text-text-primary border-b-2 border-text-primary'
              : 'text-text-tertiary hover:text-text-secondary'
          )}
        >
          应用
        </button>
      </div>

      {/* 列表内容 */}
      <div className="max-h-[300px] overflow-y-auto">
        {activeTab === 'skill' ? (
          <SkillList
            servers={filteredServers}
            selectedSkillIds={selectedSkillIds}
            onSelectSkill={onSelectSkill}
            isLoading={skillLoading}
            searchTerm={searchTerm}
          />
        ) : (
          <AppList
            apps={filteredApps}
            selectedAppIds={selectedAppIds}
            onSelectApp={onSelectApp}
            onStartNewConversation={onStartNewConversation}
            isLoading={appsLoading}
            searchTerm={searchTerm}
          />
        )}
      </div>
    </div>
  )
}
