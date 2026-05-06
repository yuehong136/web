import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Server,
  Zap,
  TestTube,
  Package,
  Activity,
  Database,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp
} from 'lucide-react'

// 导入我们创建的页面组件
import { MCPServersPage } from '@/pages/settings/MCPServersPage'
import { MCPToolsPage } from '@/pages/settings/MCPToolsPage'
import { MCPTestPage } from '@/pages/settings/MCPTestPage'
import { MCPBatchPage } from '@/pages/settings/MCPBatchPage'

export const MCPDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedServerId, setSelectedServerId] = useState<string | undefined>()

  // 模拟数据 - 在实际使用中这些数据会从API获取
  const stats = {
    totalServers: 12,
    activeServers: 9,
    totalTools: 36,
    successfulConnections: 8,
    avgResponseTime: 245,
    protocolTypes: 4
  }

  const recentActivities = [
    { 
      type: 'success', 
      title: '服务器连接成功', 
      description: 'Weather API 服务器已成功连接',
      time: '2分钟前',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    { 
      type: 'warning', 
      title: '连接响应缓慢', 
      description: 'Database MCP 服务器响应时间超过3秒',
      time: '5分钟前',
      icon: AlertCircle,
      color: 'text-yellow-600'
    },
    { 
      type: 'info', 
      title: '新工具发现', 
      description: 'Search API 服务器新增3个可用工具',
      time: '10分钟前',
      icon: Zap,
      color: 'text-blue-600'
    },
    { 
      type: 'info', 
      title: '批量导入完成', 
      description: '成功导入5个MCP服务器配置',
      time: '15分钟前',
      icon: Package,
      color: 'text-purple-600'
    }
  ]

  const quickActions = [
    {
      title: '添加服务器',
      description: '快速添加新的MCP服务器',
      icon: Server,
      color: 'bg-blue-500',
      action: () => setActiveTab('servers')
    },
    {
      title: '测试连接',
      description: '测试服务器连接状态',
      icon: TestTube,
      color: 'bg-green-500',
      action: () => setActiveTab('test')
    },
    {
      title: '管理工具',
      description: '查看和管理所有工具',
      icon: Zap,
      color: 'bg-purple-500',
      action: () => setActiveTab('tools')
    },
    {
      title: '批量操作',
      description: '批量导入导出配置',
      icon: Package,
      color: 'bg-orange-500',
      action: () => setActiveTab('batch')
    }
  ]

  return (
    <div className="min-h-screen bg-background-subtle">
      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* 顶部导航 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  MCP服务器管理系统
                </h1>
                <p className="text-muted-foreground mt-2">
                  全面管理您的MCP服务器生态系统，提供完整的工具链和监控能力
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                系统运行正常
              </Badge>
            </div>

            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[var(--color-components-button-primary-bg)] data-[state=active]:text-[var(--color-components-button-primary-text)]">
                概览面板
              </TabsTrigger>
              <TabsTrigger value="servers" className="data-[state=active]:bg-[var(--color-components-button-primary-bg)] data-[state=active]:text-[var(--color-components-button-primary-text)]">
                服务器管理
              </TabsTrigger>
              <TabsTrigger value="tools" className="data-[state=active]:bg-[var(--color-components-button-primary-bg)] data-[state=active]:text-[var(--color-components-button-primary-text)]">
                工具管理
              </TabsTrigger>
              <TabsTrigger value="test" className="data-[state=active]:bg-[var(--color-components-button-primary-bg)] data-[state=active]:text-[var(--color-components-button-primary-text)]">
                连接测试
              </TabsTrigger>
              <TabsTrigger value="batch" className="data-[state=active]:bg-[var(--color-components-button-primary-bg)] data-[state=active]:text-[var(--color-components-button-primary-text)]">
                批量操作
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 概览面板 */}
          <TabsContent value="overview" className="space-y-8">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <Card className="card-modern hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Server className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">服务器总数</p>
                      <p className="text-2xl font-bold text-text-primary">{stats.totalServers}</p>
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
                      <p className="text-sm font-medium text-muted-foreground">活跃服务器</p>
                      <p className="text-2xl font-bold text-text-primary">{stats.activeServers}</p>
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
                      <p className="text-2xl font-bold text-text-primary">{stats.totalTools}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-modern hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">成功连接</p>
                      <p className="text-2xl font-bold text-text-primary">{stats.successfulConnections}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-modern hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">平均响应</p>
                      <p className="text-2xl font-bold text-text-primary">{stats.avgResponseTime}ms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-modern hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Database className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">协议类型</p>
                      <p className="text-2xl font-bold text-text-primary">{stats.protocolTypes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 快速操作 */}
              <div className="lg:col-span-2">
                <Card className="card-modern">
                  <CardHeader>
                    <CardTitle>快速操作</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {quickActions.map((action, index) => (
                        <div
                          key={index}
                          className="p-4 border border-border-default rounded-lg hover:bg-background-subtle cursor-pointer transition-colors group"
                          onClick={action.action}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-3 ${action.color} rounded-lg group-hover:scale-110 transition-transform`}>
                              <action.icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-text-primary mb-1 group-hover:text-blue-600 transition-colors">
                                {action.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">{action.description}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 最近活动 */}
              <Card className="card-modern">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    最近活动
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-background-subtle transition-colors">
                        <div className={`p-1 rounded-full ${activity.color}`}>
                          <activity.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary text-sm">{activity.title}</p>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 服务器管理页面 */}
          <TabsContent value="servers">
            <MCPServersPage onServerSelect={setSelectedServerId} />
          </TabsContent>

          {/* 工具管理页面 */}
          <TabsContent value="tools">
            <MCPToolsPage serverId={selectedServerId} />
          </TabsContent>

          {/* 连接测试页面 */}
          <TabsContent value="test">
            <MCPTestPage />
          </TabsContent>

          {/* 批量操作页面 */}
          <TabsContent value="batch">
            <MCPBatchPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}