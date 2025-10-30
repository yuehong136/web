import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReactFlowProvider } from '@xyflow/react'
import { Button } from '@/components/ui/button'
import {
  Save,
  Play,
  ArrowLeft,
  History,
  FileText,
  Settings,
  Download,
  ChevronDown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import AgentCanvas from './canvas'
import { useFetchDataOnMount } from './hooks/use-fetch-data'
import { useSaveGraph } from './hooks/use-save-graph'
import { useWatchAgentChange } from './hooks/use-watch-agent-change'
import { agentAPI } from '@/api/agent'
import { toast } from '@/lib/toast'
import { useParams } from 'react-router-dom'

export default function AgentCanvasPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // 获取Canvas数据并初始化画布
  const { flowDetail, loading: dataLoading } = useFetchDataOnMount()
  
  // 保存功能
  const { saveGraph, loading: saving } = useSaveGraph(id, true)
  
  // 自动保存时间显示
  const lastSaveTime = useWatchAgentChange()

  const [title, setTitle] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  // 当数据加载完成后，设置标题
  useState(() => {
    if (flowDetail?.title) {
      const titleText = typeof flowDetail.title === 'object'
        ? (flowDetail.title.zh || flowDetail.title.en || 'Untitled Agent')
        : (flowDetail.title || 'Untitled Agent')
      setTitle(titleText)
    }
  })

  // 保存
  const handleSave = useCallback(async () => {
    console.log('💾 [保存] 开始保存...')
    await saveGraph(title)
  }, [saveGraph, title])

  // 运行
  const handleRun = useCallback(async () => {
    console.log('▶️ [运行] 准备运行工作流...')
    
    try {
      // 先保存当前状态
      await saveGraph(title)
      
      // 重置Agent状态
      await agentAPI.resetAgent(id!)
      
      // TODO: 打开运行对话框或开始SSE流
      toast.success('开始执行工作流')
      
    } catch (error) {
      console.error('Run error:', error)
      toast.error('执行失败')
    }
  }, [id, saveGraph, title])

  // 导出JSON
  const handleExportJSON = useCallback(() => {
    if (flowDetail?.dsl?.graph) {
      const jsonStr = JSON.stringify(flowDetail.dsl.graph, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title || 'agent'}.json`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('导出成功')
    }
  }, [flowDetail, title])

  // 查看历史版本
  const handleShowVersions = () => {
    console.log('📜 打开版本历史')
    // TODO: 实现版本历史对话框
    toast.info('版本历史功能开发中')
  }

  // 查看日志
  const handleShowLogs = () => {
    console.log('📝 打开执行日志')
    // TODO: 实现日志查看
    toast.info('日志功能开发中')
  }

  // 打开设置
  const handleShowSettings = () => {
    console.log('⚙️ 打开设置')
    // TODO: 实现设置对话框
    toast.info('设置功能开发中')
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-500">加载画布中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部工具栏 */}
      <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
        {/* 左侧：面包屑和标题 */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/agents')}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            智能体
          </Button>
          
          <div className="h-6 w-px bg-gray-300 flex-shrink-0" />
          
          {/* 标题编辑 */}
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingTitle(false)
                    handleSave()
                  }
                  if (e.key === 'Escape') {
                    setIsEditingTitle(false)
                  }
                }}
                className="text-lg font-semibold border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 w-full max-w-md"
                placeholder="Agent名称"
                autoFocus
              />
            ) : (
              <div className="flex flex-col">
                <h1
                  className="text-lg font-semibold cursor-pointer hover:text-blue-600 transition-colors truncate max-w-md"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {title || 'Untitled Agent'}
                </h1>
                {lastSaveTime && (
                  <div className="text-xs text-gray-500">
                    已自动保存 {lastSaveTime}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? '保存中...' : '保存'}
          </Button>
          
          <Button size="sm" onClick={handleRun}>
            <Play className="w-4 h-4 mr-2" />
            运行
          </Button>

          <Button variant="outline" size="sm" onClick={handleShowVersions}>
            <History className="w-4 h-4 mr-2" />
            历史版本
          </Button>

          <Button variant="outline" size="sm" onClick={handleShowLogs}>
            <FileText className="w-4 h-4 mr-2" />
            日志
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ChevronDown className="w-4 h-4 mr-2" />
                管理
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportJSON}>
                <Download className="w-4 h-4 mr-2" />
                导出JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleShowSettings}>
                <Settings className="w-4 h-4 mr-2" />
                设置
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 主画布区域 */}
      <div className="flex-1 relative overflow-hidden">
        <ReactFlowProvider>
          <AgentCanvas />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
