import React from 'react'
import { 
  MessageSquare, 
  Database, 
  FileText, 
  Users, 
  TrendingUp,
  Activity,
  Clock,
  Zap
} from 'lucide-react'
import { Card } from '../../components/ui/card'

const stats = [
  {
    title: '总对话数',
    value: '1,234',
    change: '+12%',
    changeType: 'positive' as const,
    icon: MessageSquare,
  },
  {
    title: '知识库数量',
    value: '8',
    change: '+2',
    changeType: 'positive' as const,
    icon: Database,
  },
  {
    title: '文档总数',
    value: '156',
    change: '+18',
    changeType: 'positive' as const,
    icon: FileText,
  },
  {
    title: '活跃用户',
    value: '89',
    change: '+5%',
    changeType: 'positive' as const,
    icon: Users,
  },
]

const recentActivities = [
  {
    id: '1',
    type: 'conversation',
    title: '新建对话：产品咨询',
    time: '2分钟前',
    icon: MessageSquare,
  },
  {
    id: '2',
    type: 'knowledge',
    title: '更新知识库：产品文档',
    time: '15分钟前',
    icon: Database,
  },
  {
    id: '3',
    type: 'document',
    title: '上传文档：API接口说明',
    time: '1小时前',
    icon: FileText,
  },
  {
    id: '4',
    type: 'user',
    title: '新用户注册',
    time: '2小时前',
    icon: Users,
  },
]

export const DashboardPage: React.FC = () => {
  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">仪表板</h1>
        <p className="text-gray-600 mt-2">
          欢迎使用 Multi-RAG 智能对话平台
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                  <p className={`text-sm mt-2 flex items-center ${
                    stat.changeType === 'positive' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {stat.change}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 使用统计图表 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              使用统计
            </h2>
            <div className="flex items-center text-sm text-gray-500">
              <Activity className="h-4 w-4 mr-1" />
              最近7天
            </div>
          </div>
          
          {/* 简单的统计展示 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">对话次数</span>
              <div className="flex items-center">
                <div className="w-24 h-2 bg-gray-200 rounded-full mr-3">
                  <div className="w-16 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium">67%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">知识库查询</span>
              <div className="flex items-center">
                <div className="w-24 h-2 bg-gray-200 rounded-full mr-3">
                  <div className="w-20 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium">83%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">文档上传</span>
              <div className="flex items-center">
                <div className="w-24 h-2 bg-gray-200 rounded-full mr-3">
                  <div className="w-12 h-2 bg-yellow-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium">50%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">用户活跃度</span>
              <div className="flex items-center">
                <div className="w-24 h-2 bg-gray-200 rounded-full mr-3">
                  <div className="w-18 h-2 bg-purple-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium">75%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 最近活动 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              最近活动
            </h2>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              实时更新
            </div>
          </div>
          
          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const Icon = activity.icon
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* 快速操作 */}
      <div className="mt-8">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            快速操作
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">开始对话</h3>
                  <p className="text-sm text-gray-500">创建新的AI对话</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">创建知识库</h3>
                  <p className="text-sm text-gray-500">构建新的知识库</p>
                </div>
              </div>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">AI工具</h3>
                  <p className="text-sm text-gray-500">使用AI辅助工具</p>
                </div>
              </div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}