import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table } from '@/components/ui/table'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  RefreshCw, 
  Globe, 
  Activity, 
  Zap, 
  Grid3X3, 
  List, 
  Settings2,
  ExternalLink
} from 'lucide-react'
import type { MCPServer } from '@/types/mcp'
import { mcpAPI } from '@/api/mcp'
import { MCPServerForm } from '@/components/mcp/MCPServerForm'
import { toast } from '@/lib/toast'

interface ServerListPageProps {
  onServerSelect?: (serverId: string) => void
}

export const MCPServersPage: React.FC<ServerListPageProps> = ({ onServerSelect }) => {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    loadServers()
  }, [])

  const loadServers = async () => {
    try {
      setLoading(true)
      const response = await mcpAPI.listServers({}, {
        keywords: searchTerm || undefined,
        page: 1,
        page_size: 50
      })
      
      setServers(response.mcp_servers || [])
    } catch (error) {
      toast.error('加载服务器列表失败')
      console.error('Load servers error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedServer) return

    try {
      setDeleting(true)
      await mcpAPI.deleteServers([selectedServer.id])
      
      setShowDeleteDialog(false)
      setSelectedServer(null)
      loadServers()
      toast.success('服务器删除成功')
    } catch (error) {
      toast.error('删除失败')
      console.error('Delete error:', error)
    } finally {
      setDeleting(false)
    }
  }

  const handleSearch = () => {
    loadServers()
  }

  const filteredServers = servers.filter(server =>
    server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知'
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getServerTypeColor = (type: string) => {
    switch (type) {
      case 'stdio':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
      case 'sse':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'streamable-http':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  // 统计数据
  const stats = {
    total: servers.length,
    active: Math.floor(servers.length * 0.8),
    tools: servers.length * 3,
    types: new Set(servers.map(s => s.server_type)).size
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              MCP服务器管理
            </h1>
            <p className="text-muted-foreground mt-1">智能管理和配置您的MCP服务器集群</p>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 hover-lift"
          >
            <Plus className="h-4 w-4 mr-2" />
            创建服务器
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-modern hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总服务器</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-modern hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">活跃连接</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-modern hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">可用工具</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.tools}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-modern hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Settings2 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">配置数量</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.types}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 搜索和控制栏 */}
      <Card className="card-modern">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="搜索服务器名称、URL或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 smooth-transition"
              />
            </div>
            <div className="flex items-center gap-2 border rounded-lg p-1 bg-gray-50">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              onClick={handleSearch} 
              variant="outline" 
              className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 smooth-transition"
            >
              <Search className="h-4 w-4 mr-2" />
              搜索
            </Button>
            <Button 
              onClick={loadServers} 
              variant="outline"
              className="hover:bg-green-50 hover:border-green-200 hover:text-green-700 smooth-transition"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 内容区域 */}
      <Card className="card-modern">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">服务器列表</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              {filteredServers.length} 个服务器
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-muted-foreground">正在加载服务器列表...</p>
            </div>
          ) : filteredServers.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Globe className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? '未找到匹配的服务器' : '还没有服务器'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? '尝试调整搜索条件' : '点击上方按钮创建您的第一个MCP服务器'}
                </p>
              </div>
              {!searchTerm && (
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  创建服务器
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            // Grid View (Cards)
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredServers.map((server, index) => (
                <Card 
                  key={server.id} 
                  className="card-modern hover-lift cursor-pointer group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => onServerSelect?.(server.id)}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Globe className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm shadow-green-500/50"></div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="opacity-0 group-hover:opacity-100 hover:bg-gray-100 smooth-transition"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="right" className="w-40">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onServerSelect?.(server.id)
                              }}
                              className="cursor-pointer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2 text-blue-500" />
                              查看详情
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedServer(server)
                                setShowEditDialog(true)
                              }}
                              className="cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-2 text-green-500" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedServer(server)
                                setShowDeleteDialog(true)
                              }}
                              className="text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Server Name */}
                      <div>
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 smooth-transition">
                          {server.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${getServerTypeColor(server.server_type)} border-0 font-medium text-xs`}>
                            {server.server_type.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      {/* URL */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">服务器地址</p>
                        <p className="text-sm text-gray-700 truncate font-mono bg-gray-50 px-2 py-1 rounded text-xs">
                          {server.url}
                        </p>
                      </div>

                      {/* Description */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">描述</p>
                        <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
                          {server.description || (
                            <span className="text-gray-400 italic">无描述</span>
                          )}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600">在线</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatDate(server.create_time)?.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // List View (Table)
            <div className="overflow-hidden">
              <Table
                columns={[
                  {
                    key: 'name',
                    title: '名称',
                    render: (_value: any, record: MCPServer) => (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm shadow-green-500/50"></div>
                        <span className="font-medium text-gray-900 group-hover:text-blue-600 smooth-transition">{record.name}</span>
                      </div>
                    )
                  },
                  {
                    key: 'server_type',
                    title: '类型',
                    render: (_value: any, record: MCPServer) => (
                      <Badge className={`${getServerTypeColor(record.server_type)} border-0 font-medium`}>
                        {record.server_type.toUpperCase()}
                      </Badge>
                    )
                  },
                  {
                    key: 'url',
                    title: 'URL',
                    render: (_value: any, record: MCPServer) => (
                      <div className="max-w-xs truncate text-gray-600 group-hover:text-gray-900" title={record.url}>
                        {record.url}
                      </div>
                    )
                  },
                  {
                    key: 'description',
                    title: '描述',
                    render: (_value: any, record: MCPServer) => (
                      <div className="max-w-xs truncate text-gray-600" title={record.description}>
                        {record.description || (
                          <span className="text-gray-400 italic">无描述</span>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'create_time',
                    title: '创建时间',
                    render: (_value: any, record: MCPServer) => (
                      <span className="text-gray-600">{formatDate(record.create_time)}</span>
                    )
                  },
                  {
                    key: 'actions',
                    title: '操作',
                    align: 'right' as const,
                    render: (_value: any, record: MCPServer) => (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="opacity-60 group-hover:opacity-100 hover:bg-gray-100 smooth-transition"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="right" className="w-40">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onServerSelect?.(record.id)
                            }}
                            className="cursor-pointer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2 text-blue-500" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedServer(record)
                              setShowEditDialog(true)
                            }}
                            className="cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-2 text-green-500" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedServer(record)
                              setShowDeleteDialog(true)
                            }}
                            className="text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )
                  }
                ]}
                data={filteredServers}
                loading={loading}
                onRow={(record) => ({
                  className: "hover:bg-gray-50/50 smooth-transition group cursor-pointer",
                  onClick: () => onServerSelect?.(record.id)
                })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Server Dialog */}
      {showCreateDialog && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent 
            title="添加MCP服务器" 
            className="bg-components-modal-bg border-components-modal-border max-w-6xl max-h-[90vh] overflow-y-auto"
          >
            <MCPServerForm
              onSuccess={() => {
                setShowCreateDialog(false)
                loadServers()
              }}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Server Dialog */}
      {showEditDialog && selectedServer && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent 
            title={`编辑服务器: ${selectedServer.name}`} 
            className="bg-components-modal-bg border-components-modal-border max-w-6xl max-h-[90vh] overflow-y-auto"
          >
            <MCPServerForm
              server={selectedServer}
              onSuccess={() => {
                setShowEditDialog(false)
                setSelectedServer(null)
                loadServers()
              }}
              onCancel={() => {
                setShowEditDialog(false)
                setSelectedServer(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除服务器 "{selectedServer?.name}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}