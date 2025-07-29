import React from 'react'
import { X, Sparkles, Bot, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (type: 'app' | 'agent') => void
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  if (!isOpen) return null

  const projectTypes = [
    {
      type: 'app' as const,
      title: '创建应用',
      description: '构建完整的AI应用程序，提供丰富的用户界面和功能',
      icon: <Sparkles className="h-12 w-12 text-purple-600" />,
      color: 'purple',
      features: ['可视化界面', '多模态交互', '工作流集成', '数据可视化'],
    },
    {
      type: 'agent' as const,
      title: '创建智能体',
      description: '创建专业的AI助手，具备特定领域的专业知识和能力',
      icon: <Bot className="h-12 w-12 text-blue-600" />,
      color: 'blue',
      features: ['专业知识库', '对话交互', '任务执行', '学习适应'],
    },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* 弹窗头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">新建项目</h2>
            <p className="text-gray-600 mt-1">选择您要创建的项目类型</p>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* 项目类型选择 */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projectTypes.map((projectType) => (
              <div
                key={projectType.type}
                className={`group relative bg-white border-2 border-gray-200 rounded-xl p-6 transition-all cursor-pointer ${
                  projectType.color === 'purple' 
                    ? 'hover:border-purple-200 hover:shadow-lg' 
                    : 'hover:border-blue-200 hover:shadow-lg'
                }`}
                onClick={() => onCreateProject(projectType.type)}
              >
                {/* 图标和标题 */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-xl transition-colors ${
                    projectType.color === 'purple' 
                      ? 'bg-purple-50 group-hover:bg-purple-100' 
                      : 'bg-blue-50 group-hover:bg-blue-100'
                  }`}>
                    {projectType.icon}
                  </div>
                  <div>
                    <h3 className={`text-xl font-semibold transition-colors ${
                      projectType.color === 'purple'
                        ? 'text-gray-900 group-hover:text-purple-600'
                        : 'text-gray-900 group-hover:text-blue-600'
                    }`}>
                      {projectType.title}
                    </h3>
                  </div>
                </div>

                {/* 描述 */}
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {projectType.description}
                </p>

                {/* 特性列表 */}
                <div className="space-y-2 mb-6">
                  {projectType.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        projectType.color === 'purple' ? 'bg-purple-500' : 'bg-blue-500'
                      }`} />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* 创建按钮 */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">点击创建</span>
                  <ArrowRight className={`h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity ${
                    projectType.color === 'purple' ? 'text-purple-500' : 'text-blue-500'
                  }`} />
                </div>

                {/* 悬停效果 */}
                <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                  projectType.color === 'purple' 
                    ? 'bg-gradient-to-br from-purple-500/5 to-purple-600/5' 
                    : 'bg-gradient-to-br from-blue-500/5 to-blue-600/5'
                }`} />
              </div>
            ))}
          </div>
        </div>

        {/* 底部说明 */}
        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              <strong className="text-gray-900">提示：</strong>
              创建后您可以随时修改项目设置、添加功能模块，或者将应用和智能体相互转换。
              我们提供了丰富的模板和组件来帮助您快速构建。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}