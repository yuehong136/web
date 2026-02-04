import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Outlet, useParams, useNavigate, Link, useLocation, useMatch } from 'react-router-dom'
import { ArrowLeft, FileText, Search, Settings, Database, House, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Loading } from '@/components/ui/loading'
import { useKnowledgeStore } from '@/stores/knowledge'
import { ROUTES } from '@/constants'
import { knowledgeAPI } from '@/api/knowledge'
import { getAvatarGradient } from '@/components/ui/resource-list'
import { cn } from '@/lib/utils'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const KnowledgeDetailLayout: React.FC = () => {
  const { id, docId } = useParams<{ id: string; docId?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { currentKnowledgeBase, isLoading, getKnowledgeBase } = useKnowledgeStore()
  const chunksMatch = useMatch('/knowledge/:id/documents/:docId/chunks')
  const isChunksRoute = Boolean(chunksMatch)

  React.useEffect(() => {
    if (id) {
      getKnowledgeBase(id)
    }
  }, [id, getKnowledgeBase])

  const sidebarItems = [
    {
      key: 'documents',
      label: '文档',
      icon: FileText,
      path: `/knowledge/${id}/documents`,
    },
    {
      key: 'search',
      label: '检索测试',
      icon: Search,
      path: `/knowledge/${id}/search`,
    },
    {
      key: 'logs',
      label: '日志',
      icon: ScrollText,
      path: `/knowledge/${id}/logs`,
    },
    {
      key: 'settings',
      label: '设置',
      icon: Settings,
      path: `/knowledge/${id}/settings`,
    },
  ]

  const currentPath = location.pathname
  
  const { data: currentDocument } = useQuery({
    queryKey: ['documentDetail', docId],
    enabled: Boolean(isChunksRoute && docId),
    queryFn: async () => {
      return knowledgeAPI.document.get(docId!)
    },
  })

  if (isLoading || !currentKnowledgeBase) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading variant="spinner" size="lg" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部导航 */}
      {isChunksRoute ? (
        <header className="flex items-center bg-card border-b border-border px-5 py-4 shrink-0">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate(ROUTES.HOME)}>
                  <House className="w-4 h-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate(ROUTES.KNOWLEDGE)}>
                  知识库
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate(`/knowledge/${id}/documents`)}>
                  {currentKnowledgeBase.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="max-w-[240px] truncate"
                  onClick={() => navigate(`/knowledge/${id}/documents`)}
                >
                  {currentDocument?.name || docId || '文档'}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>切片</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
      ) : (
        <div 
          className="px-6 py-4"
          style={{
            backgroundColor: 'var(--color-background-surface)',
            borderBottom: '1px solid var(--color-border-default)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => navigate(ROUTES.KNOWLEDGE)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3">
                {currentKnowledgeBase.avatar ? (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentKnowledgeBase.avatar} alt={currentKnowledgeBase.name} />
                    <AvatarFallback><Database className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                ) : (
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      'bg-gradient-to-br shadow-sm',
                      getAvatarGradient(currentKnowledgeBase.name)
                    )}
                  >
                    <span className="text-white font-semibold text-lg">
                      {currentKnowledgeBase.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h1 
                    className="text-xl font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {currentKnowledgeBase.name}
                  </h1>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {currentKnowledgeBase.description || '暂无描述'}
                  </p>
                </div>
              </div>
            </div>
            
            <div 
              className="flex items-center space-x-3 text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <span>{currentKnowledgeBase.doc_num || 0} 个文档</span>
              <span>{currentKnowledgeBase.chunk_num || 0} 个块</span>
              <span>{(currentKnowledgeBase.token_num || 0).toLocaleString()} Token</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        {!isChunksRoute && (
          <div 
            className="w-64 p-4"
            style={{
              backgroundColor: 'var(--color-components-sidebar-bg)',
              borderRight: '1px solid var(--color-components-sidebar-border)'
            }}
          >
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/')
                
                return (
                  <Link
                    key={item.key}
                    to={item.path}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: isActive 
                        ? 'var(--color-components-sidebar-item-bg-active)' 
                        : 'transparent',
                      color: isActive 
                        ? 'var(--color-components-sidebar-item-text-active)' 
                        : 'var(--color-components-sidebar-item-text)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--color-components-sidebar-item-bg-hover)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        )}

        {/* 主内容区 */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export { KnowledgeDetailLayout }