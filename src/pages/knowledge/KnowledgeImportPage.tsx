import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { ROUTES } from '../../constants'

export const KnowledgeImportPage: React.FC = () => {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(ROUTES.KNOWLEDGE)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* 页面头部 */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">导入知识库</h1>
            <p className="text-gray-600 mt-1">
              从文件或其他系统导入知识库数据
            </p>
          </div>
        </div>
      </div>

      {/* 导入页面内容 */}
      <Card className="p-6">
        <div className="text-center py-12">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            导入知识库
          </h3>
          <p className="text-gray-500 mb-4">
            导入功能正在开发中...
          </p>
          <Button onClick={handleBack}>
            返回知识库列表
          </Button>
        </div>
      </Card>
    </div>
  )
}