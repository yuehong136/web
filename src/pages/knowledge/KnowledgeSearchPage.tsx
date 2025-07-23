import React from 'react'
import { useParams } from 'react-router-dom'
import { Search, Play, Settings as SettingsIcon } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'
import { useKnowledgeStore } from '../../stores/knowledge'

const KnowledgeSearchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentKnowledgeBase } = useKnowledgeStore()

  const [searchQuery, setSearchQuery] = React.useState('')
  const [searchParams, setSearchParams] = React.useState({
    topK: 5,
    scoreThreshold: 0.7,
    searchType: 'hybrid'
  })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">检索测试</h1>
        <p className="text-gray-600 mt-1">
          测试知识库 "{currentKnowledgeBase?.name}" 的检索效果
        </p>
      </div>

      <div className="space-y-6">
        {/* 搜索输入 */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                搜索查询
              </label>
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="请输入搜索内容..."
                    leftIcon={<Search className="h-4 w-4" />}
                  />
                </div>
                <Button disabled={!searchQuery.trim()}>
                  <Play className="h-4 w-4 mr-2" />
                  搜索
                </Button>
              </div>
            </div>

            {/* 搜索参数 */}
            <details className="border-t pt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-4">
                <SettingsIcon className="h-4 w-4 inline mr-2" />
                高级设置
              </summary>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    返回结果数量
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={searchParams.topK}
                    onChange={(e) => setSearchParams(prev => ({
                      ...prev,
                      topK: Number(e.target.value)
                    }))}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    相似度阈值
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={searchParams.scoreThreshold}
                    onChange={(e) => setSearchParams(prev => ({
                      ...prev,
                      scoreThreshold: Number(e.target.value)
                    }))}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    搜索类型
                  </label>
                  <select
                    value={searchParams.searchType}
                    onChange={(e) => setSearchParams(prev => ({
                      ...prev,
                      searchType: e.target.value
                    }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="vector">向量搜索</option>
                    <option value="fulltext">全文搜索</option>
                    <option value="hybrid">混合搜索</option>
                  </select>
                </div>
              </div>
            </details>
          </div>
        </Card>

        {/* 搜索结果 */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">搜索结果</h3>
          
          {!searchQuery ? (
            <div className="text-center py-8">
              <Search className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">请输入搜索内容开始测试</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">检索测试功能开发中...</p>
              <p className="text-sm text-gray-400 mt-2">
                将实现向量搜索、全文搜索和混合搜索功能
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export { KnowledgeSearchPage }