import React from 'react'
import { Outlet, useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { ArrowLeft, FileText, Search, Settings, Database } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Avatar } from '../../components/ui/avatar'
import { Loading } from '../../components/ui/loading'
import { useKnowledgeStore } from '../../stores/knowledge'
import { cn } from '../../lib/utils'
import { ROUTES } from '../../constants'

const KnowledgeDetailLayout: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { currentKnowledgeBase, isLoading, getKnowledgeBase } = useKnowledgeStore()

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
      key: 'settings',
      label: '设置',
      icon: Settings,
      path: `/knowledge/${id}/settings`,
    },
  ]

  const currentPath = location.pathname

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
      <div className="border-b border-gray-200 bg-white px-6 py-4">
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
              <Avatar 
                src={currentKnowledgeBase.avatar}
                alt={currentKnowledgeBase.name}
                size="lg"
                fallback={<Database className="h-5 w-5" />}
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {currentKnowledgeBase.name}
                </h1>
                <p className="text-sm text-gray-500">
                  {currentKnowledgeBase.description || '暂无描述'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <span>{currentKnowledgeBase.doc_num || 0} 个文档</span>
            <span>{currentKnowledgeBase.chunk_num || 0} 个块</span>
            <span>{(currentKnowledgeBase.token_num || 0).toLocaleString()} Token</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/')
              
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-100 text-primary-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export { KnowledgeDetailLayout }