import React from 'react'
import { Save } from 'lucide-react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useKnowledgeStore } from '../../stores/knowledge'
import { useUIStore } from '../../stores/ui'
import type { KnowledgeBase, UpdateKBRequest } from '../../types/api'

interface QuickEditModalProps {
  isOpen: boolean
  onClose: () => void
  knowledgeBase: KnowledgeBase
}

const QuickEditModal: React.FC<QuickEditModalProps> = ({
  isOpen,
  onClose,
  knowledgeBase
}) => {
  const { updateKnowledgeBase } = useKnowledgeStore()
  const { addNotification } = useUIStore()
  
  const [formData, setFormData] = React.useState({
    name: knowledgeBase.name || '',
    description: knowledgeBase.description || ''
  })
  const [isLoading, setIsLoading] = React.useState(false)

  // 当知识库变化时更新表单数据
  React.useEffect(() => {
    setFormData({
      name: knowledgeBase.name || '',
      description: knowledgeBase.description || ''
    })
  }, [knowledgeBase])

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const name = formData.name.trim()
    
    // 前端验证
    if (!name) {
      addNotification({
        type: 'error',
        title: '验证失败',
        message: '知识库名称不能为空'
      })
      return
    }
    
    // 验证名称格式：必须以字母开头，只能包含字母、数字和下划线
    const namePattern = /^[a-zA-Z][a-zA-Z0-9_]*$/
    if (!namePattern.test(name)) {
      addNotification({
        type: 'error',
        title: '验证失败',
        message: '知识库名称必须以字母开头，只能包含字母、数字和下划线'
      })
      return
    }
    
    // 验证名称长度（假设限制为100个字符）
    if (name.length > 100) {
      addNotification({
        type: 'error',
        title: '验证失败',
        message: '知识库名称长度不能超过100个字符'
      })
      return
    }

    try {
      setIsLoading(true)
      
      const updateData: UpdateKBRequest = {
        kb_id: knowledgeBase.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null
      }

      await updateKnowledgeBase(updateData)
      
      addNotification({
        type: 'success',
        title: '更新成功',
        message: '知识库信息已成功更新'
      })
      
      onClose()
    } catch (error: any) {
      console.error('Update knowledge base failed:', error)
      
      // 处理具体的后端错误消息
      let errorMessage = '更新知识库信息时发生错误'
      
      if (error?.response?.data?.retmsg) {
        const backendMessage = error.response.data.retmsg
        
        // 根据后端错误消息提供中文提示
        if (backendMessage.includes('Dataset name must be string')) {
          errorMessage = '知识库名称必须是字符串格式'
        } else if (backendMessage.includes('Dataset name can\'t be empty')) {
          errorMessage = '知识库名称不能为空'
        } else if (backendMessage.includes('Dataset name length is')) {
          errorMessage = '知识库名称长度超出限制，请使用更短的名称'
        } else if (backendMessage.includes('Dataset name must start with a letter and contain only letters, numbers, and underscores')) {
          errorMessage = '知识库名称必须以字母开头，只能包含字母、数字和下划线'
        } else if (backendMessage.includes('已存在该知识库名')) {
          errorMessage = '该知识库名称已存在，请使用其他名称'
        } else if (backendMessage.includes('Tenant not found')) {
          errorMessage = '用户信息未找到，请重新登录'
        } else {
          // 如果是其他后端错误，直接显示后端消息
          errorMessage = backendMessage
        }
      }
      
      addNotification({
        type: 'error',
        title: '更新失败',
        message: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // 重置表单数据
    setFormData({
      name: knowledgeBase.name || '',
      description: knowledgeBase.description || ''
    })
    onClose()
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleCancel}
      title="编辑知识库"
      size="md"
      footer={
        <div className="flex items-center justify-end space-x-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isLoading}
            leftIcon={<Save className="h-4 w-4" />}
          >
            保存
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            知识库名称 *
          </label>
          <Input
            value={formData.name}
            onChange={handleInputChange('name')}
            placeholder="例如：my_knowledge_base"
            title="知识库名称必须以字母开头，只能包含字母、数字和下划线"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            名称必须以字母开头，只能包含字母、数字和下划线
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            描述
          </label>
          <textarea
            value={formData.description}
            onChange={handleInputChange('description')}
            placeholder="请输入知识库描述"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </form>
    </Modal>
  )
}

export { QuickEditModal }