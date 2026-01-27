import React, { useState, useEffect, useRef } from 'react'
import { Plus, Sparkles, Bot, MoreVertical, Briefcase, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CreateProjectModal } from './components/CreateProjectModal'
import { CreateAppModal } from './components/CreateAppModal'
import { ROUTES } from '@/constants'
import { useDialogApps, useDeleteDialogApps } from '@/hooks/use-dialog-apps'
import type { DialogApp } from '@/types/api'

export const StudioPage: React.FC = () => {
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateAppModal, setShowCreateAppModal] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // 使用React Query hooks
  const { data: dialogApps = [], isLoading: loading } = useDialogApps()
  const deleteDialogAppsMutation = useDeleteDialogApps()

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenuId) {
        setActiveMenuId(null)
      }
    }

    if (activeMenuId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [activeMenuId])

  const handleCreateProject = (type: 'app' | 'agent') => {
    setShowCreateModal(false)
    if (type === 'app') {
      setShowCreateAppModal(true)
    } else {
      // 智能体创建页面暂未实现
      console.log('Creating agent - page not implemented yet')
    }
  }

  const handleCreateApp = (appData: { name: string; description: string; icon?: string }) => {
    // 现在应用已通过API创建，可以选择导航到配置页面或保持在当前页面
    console.log('App created successfully:', appData)
    
    // 可选：导航到应用配置页面
    // const searchParams = new URLSearchParams({
    //   name: appData.name,
    //   description: appData.description,
    //   ...(appData.icon && { icon: appData.icon })
    // })
    // navigate(`${ROUTES.STUDIO_CREATE_APP}?${searchParams.toString()}`)
  }

  const handleDeleteApp = (appId: string) => {
    if (confirm('确认删除该应用吗？')) {
      deleteDialogAppsMutation.mutate([appId])
    }
    setActiveMenuId(null)
  }

  const toggleMenu = (appId: string) => {
    setActiveMenuId(activeMenuId === appId ? null : appId)
  }

  const handleAppClick = (app: DialogApp) => {
    // 跳转到应用配置页面
    const searchParams = new URLSearchParams({
      id: app.id,
      name: app.name,
      description: app.description,
      ...(app.icon && { icon: app.icon })
    })
    navigate(`${ROUTES.STUDIO_CREATE_APP}?${searchParams.toString()}`)
  }

  const getAppIcon = (app: DialogApp) => {
    if (app.icon) {
      // 判断是data URL、http(s) URL还是base64字符串
      const iconSrc = app.icon.startsWith('data:') || app.icon.startsWith('http') 
        ? app.icon 
        : `data:image/png;base64,${app.icon}`
      return (
        <img 
          src={iconSrc} 
          alt={app.name}
          className="h-8 w-8 rounded object-cover"
          onError={(e) => {
            // 如果图片加载失败，显示默认图标
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextElementSibling?.classList.remove('hidden')
          }}
        />
      )
    }
    return <Sparkles className="h-8 w-8 text-purple-600" />
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">工作室</h1>
          <p className="text-gray-600 mt-2">创建和管理您的AI应用和智能体</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-2 rounded-lg flex items-center gap-2"
          variant="default"
        >
          <Plus className="h-5 w-5" />
          新建项目
        </Button>
      </div>

      {/* 项目列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // 加载状态
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 animate-pulse">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))
        ) : dialogApps.length > 0 ? (
          dialogApps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer group"
              onClick={() => handleAppClick(app)}
            >
              <div className="p-6">
                {/* 应用头部 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {getAppIcon(app)}
                      <Sparkles className="h-8 w-8 text-purple-600 hidden" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {app.name}
                      </h3>
                      <span className="text-sm text-gray-500">
                        应用
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleMenu(app.id)
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                    
                    {/* 下拉菜单 */}
                    {activeMenuId === app.id && (
                      <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 text-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteApp(app.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 应用描述 */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {app.description}
                </p>

                {/* 应用状态和时间 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        app.status === '1' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-xs text-gray-500">
                      {app.status === '1' ? '已启用' : '未启用'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDateTime(app.update_date)}
                  </span>
                </div>
              </div>

              {/* 悬停效果 */}
              <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl" />
            </div>
          ))
        ) : (
          // 空状态
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有应用</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              开始创建您的第一个AI应用，让AI为您的业务赋能
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 rounded-lg flex items-center gap-2"
          variant="default"
            >
              <Plus className="h-5 w-5" />
              创建第一个应用
            </Button>
          </div>
        )}
      </div>

      {/* 创建项目弹窗 */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateProject={handleCreateProject}
      />

      {/* 创建应用弹窗 */}
      <CreateAppModal
        isOpen={showCreateAppModal}
        onClose={() => setShowCreateAppModal(false)}
        onCreate={handleCreateApp}
      />
    </div>
  )
}