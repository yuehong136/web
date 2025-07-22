import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Database, 
  FileText, 
  Clock, 
  Users,
  Eye,
  Edit,
  Trash2,
  Filter
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'
import { Loading } from '../../components/ui/loading'
import { Table } from '../../components/ui/table'
import { useKnowledgeStore } from '../../stores/knowledge'
import { useUIStore } from '../../stores/ui'
import { cn } from '../../lib/utils'
import { ROUTES } from '../../constants'
import type { KnowledgeBaseInfo } from '../../types/api'

export const KnowledgeListPage: React.FC = () => {
  const navigate = useNavigate()
  const { 
    knowledgeBases, 
    isLoading, 
    searchQuery,
    setSearchQuery,
    loadKnowledgeBases,
    deleteKnowledgeBase 
  } = useKnowledgeStore()
  const { addNotification } = useUIStore()

  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid')
  const [selectedBases, setSelectedBases] = React.useState<string[]>([])

  React.useEffect(() => {
    loadKnowledgeBases()
  }, [loadKnowledgeBases])

  const handleCreate = () => {
    navigate(`${ROUTES.KNOWLEDGE}/create`)
  }

  const handleView = (id: string) => {
    navigate(`${ROUTES.KNOWLEDGE}/${id}`)
  }

  const handleEdit = (id: string) => {
    navigate(`${ROUTES.KNOWLEDGE}/${id}/edit`)
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个知识库吗？此操作不可撤销。')) {
      try {
        await deleteKnowledgeBase(id)
        addNotification({
          type: 'success',
          title: '删除成功',
          message: '知识库已成功删除'
        })
      } catch (error) {
        addNotification({
          type: 'error',
          title: '删除失败',
          message: '删除知识库时发生错误'
        })
      }
    }
  }

  const filteredKnowledgeBases = knowledgeBases.filter(kb =>
    kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kb.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-600 bg-green-100'
      case 'processing': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return '就绪'
      case 'processing': return '处理中'
      case 'error': return '错误'
      default: return '未知'
    }
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredKnowledgeBases.map((kb) => (
        <Card key={kb.id} className="hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {kb.name}
                  </h3>
                  <span className={cn(
                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                    getStatusColor(kb.status)
                  )}>
                    {getStatusText(kb.status)}
                  </span>
                </div>
              </div>
              <div className="relative">
                <Button variant="ghost" size="icon-sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {kb.description || '暂无描述'}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  {kb.documentCount || 0} 文档
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date(kb.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleView(kb.id)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                查看
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(kb.id)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => handleDelete(kb.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )

  const renderTableView = () => (
    <Card>
      <Table
        columns={[
          {
            key: 'name',
            title: '名称',
            render: (value: string, record: KnowledgeBaseInfo) => (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Database className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{value}</div>
                  <div className="text-sm text-gray-500">{record.description}</div>
                </div>
              </div>
            )
          },
          {
            key: 'status',
            title: '状态',
            render: (value: string) => (
              <span className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                getStatusColor(value)
              )}>
                {getStatusText(value)}
              </span>
            )
          },
          {
            key: 'documentCount',
            title: '文档数量',
            render: (value: number) => (
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-1 text-gray-400" />
                {value || 0}
              </div>
            )
          },
          {
            key: 'updatedAt',
            title: '更新时间',
            render: (value: string) => (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-gray-400" />
                {new Date(value).toLocaleDateString()}
              </div>
            )
          },
          {
            key: 'actions',
            title: '操作',
            render: (_, record: KnowledgeBaseInfo) => (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleView(record.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleEdit(record.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(record.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          }
        ]}
        data={filteredKnowledgeBases}
        loading={isLoading}
      />
    </Card>
  )

  return (
    <div className="p-6">
      {/* 页面头部 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">知识库管理</h1>
            <p className="text-gray-600 mt-1">
              管理您的知识库，上传文档，配置检索参数
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            创建知识库
          </Button>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <Input
              type="search"
              placeholder="搜索知识库..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
            
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                网格
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-none"
              >
                表格
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loading variant="spinner" size="lg" />
        </div>
      ) : filteredKnowledgeBases.length === 0 ? (
        <div className="text-center py-12">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? '未找到匹配的知识库' : '还没有知识库'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? '尝试使用不同的搜索条件' : '创建您的第一个知识库开始使用'}
          </p>
          {!searchQuery && (
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              创建知识库
            </Button>
          )}
        </div>
      ) : (
        <div>
          {viewMode === 'grid' ? renderGridView() : renderTableView()}
        </div>
      )}
    </div>
  )
}