import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFetchMCPServers } from '@/hooks/use-mcp-request'
import { useDialogApps } from '@/hooks/use-dialog-apps'
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
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'skill' | 'app'>('skill')
  const { data: serverData, isFetching: skillLoading } = useFetchMCPServers({
    page_size: 100,
    errorMessage: t('home.skillPanel.loadFailed', '加载技能列表失败'),
    enabled: open && activeTab === 'skill',
  })
  const servers = useMemo(() => serverData?.mcp_servers ?? [], [serverData])
  const [searchTerm, setSearchTerm] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  // 获取对话应用列表 — 仅在面板打开时请求
  const { data: dialogApps = [], isLoading: appsLoading } = useDialogApps({
    enabled: open,
  })

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

  // 过滤后的技能列表
  const filteredServers = useMemo(() => {
    if (!searchTerm) return servers
    const term = searchTerm.toLowerCase()
    return servers.filter(
      (server) =>
        server.name.toLowerCase().includes(term) ||
        server.description?.toLowerCase().includes(term),
    )
  }, [servers, searchTerm])

  // 过滤后的应用列表（只显示已激活的应用）
  const filteredApps = useMemo(() => {
    const activeApps = dialogApps.filter((app) => app.status === '1')
    if (!searchTerm) return activeApps
    const term = searchTerm.toLowerCase()
    return activeApps.filter(
      (app) =>
        app.name.toLowerCase().includes(term) ||
        app.description?.toLowerCase().includes(term),
    )
  }, [dialogApps, searchTerm])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className={cn(
        'absolute left-0 z-50 w-80 overflow-hidden rounded-xl border border-border-default bg-components-card-bg shadow-lg',
        direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2',
      )}
      style={{
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
      }}
    >
      {/* 搜索框 */}
      <div className="border-b border-border-default p-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder={t(
              'home.skillPanel.searchPlaceholder',
              '搜索技能/应用',
            )}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border-none bg-background-subtle py-2 pr-3 pl-9 text-sm text-text-primary outline-hidden placeholder:text-text-tertiary"
            autoFocus
          />
        </div>
      </div>

      {/* 标签切换 */}
      <div className="flex border-b border-border-default">
        <button
          onClick={() => {
            setActiveTab('skill')
            setSearchTerm('')
          }}
          className={cn(
            'flex-1 py-2.5 text-sm font-medium transition-colors',
            activeTab === 'skill'
              ? 'border-b-2 border-text-primary text-text-primary'
              : 'text-text-tertiary hover:text-text-secondary',
          )}
        >
          {t('home.skillPanel.skills', '技能')}
        </button>
        <button
          onClick={() => {
            setActiveTab('app')
            setSearchTerm('')
          }}
          className={cn(
            'flex-1 py-2.5 text-sm font-medium transition-colors',
            activeTab === 'app'
              ? 'border-b-2 border-text-primary text-text-primary'
              : 'text-text-tertiary hover:text-text-secondary',
          )}
        >
          {t('home.skillPanel.apps', '应用')}
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
