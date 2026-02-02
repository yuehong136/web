import React, { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit3, Plus, MessageSquare, Search } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'
import { useFetchDialogList } from '@/hooks/use-dialog-apps'
import type { DialogApp } from '@/types/api'

const DialogListPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    data,
    loading,
    searchString,
    handleInputChange,
    pagination,
    setPagination,
  } = useFetchDialogList()

  const dialogs = data.dialogs
  const total = data.total

  // 分页切换处理
  const handlePageChange = useCallback(
    (page: number, pageSize?: number) => {
      setPagination({ current: page, pageSize: pageSize ?? pagination.pageSize })
    },
    [setPagination, pagination.pageSize]
  )

  const handleEditPrompt = (dialogId: string) => {
    navigate(`/dialog/${dialogId}/prompt-editor`)
  }

  const handleViewTopic = (dialogId: string) => {
    navigate(`/explore`) // 导航到探索页面，在那里可以查看话题
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">对话应用</h1>
          <p className="text-gray-500 mt-1">管理您的AI对话应用 (共 {total} 个)</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="搜索应用..."
              value={searchString}
              onChange={(e) => handleInputChange(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            创建应用
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dialogs.map((dialog) => (
          <Card key={dialog.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {dialog.icon || dialog.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{dialog.name}</h3>
                  <p className="text-sm text-gray-500">{dialog.description}</p>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">系统提示词预览:</p>
              <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700 max-h-20 overflow-hidden">
                {dialog.prompt_config.system || '未设置系统提示词'}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                模型: {dialog.llm_id}
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewTopic(dialog.id)}
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  话题
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditPrompt(dialog.id)}
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  编辑提示词
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {dialogs.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchString ? '未找到匹配的应用' : '暂无对话应用'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchString ? '请尝试其他搜索关键词' : '创建您的第一个AI对话应用'}
          </p>
          {!searchString && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建应用
            </Button>
          )}
        </div>
      )}

      {/* 分页 */}
      {total > pagination.pageSize && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.current - 1)}
            disabled={pagination.current <= 1}
          >
            上一页
          </Button>
          <span className="text-sm text-gray-600">
            第 {pagination.current} / {Math.ceil(total / pagination.pageSize)} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.current + 1)}
            disabled={pagination.current >= Math.ceil(total / pagination.pageSize)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  )
}

export { DialogListPage }