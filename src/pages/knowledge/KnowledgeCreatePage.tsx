import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, HelpCircle } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'
import { useKnowledgeStore } from '../../stores/knowledge'
import { useUIStore } from '../../stores/ui'
import { llmAPI } from '../../api/llm'
import { ROUTES } from '../../constants'
import { Loading } from '../../components/ui/loading'
import { EmbeddingModelSelector } from '../../components/knowledge/EmbeddingModelSelector'
import { Tooltip } from '../../components/ui/tooltip'
import { CustomSelect } from '../../components/ui/custom-select'
import type { CreateKBRequest, LLMModel } from '../../types/api'

export const KnowledgeCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const { createKnowledgeBase } = useKnowledgeStore()
  const { addNotification } = useUIStore()
  
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    language: 'Chinese',
    permission: 'me' as 'me' | 'team',
    embd_id: '' // 向量模型ID
  })
  const [isLoading, setIsLoading] = React.useState(false)
  const [embeddingModels, setEmbeddingModels] = React.useState<LLMModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = React.useState(false)
  const [modelsError, setModelsError] = React.useState<string | undefined>()

  const languageOptions = [
    { value: 'Chinese', label: '中文', icon: '🇨🇳' },
    { value: 'English', label: '英文', icon: '🇺🇸' },
    { value: 'Japanese', label: '日文', icon: '🇯🇵' },
    { value: 'Korean', label: '韩文', icon: '🇰🇷' }
  ]

  const permissionOptions = [
    { value: 'me', label: '仅自己可见', icon: '🔒' },
    { value: 'team', label: '团队可见', icon: '👥' }
  ]

  // 加载向量模型列表
  React.useEffect(() => {
    const loadEmbeddingModels = async () => {
      try {
        setIsLoadingModels(true)
        setModelsError(undefined)
        const response = await llmAPI.list({ 
          mdl_type: 'embedding',
          available: true 
        })
        console.log('加载的向量模型响应:', response, 'Type:', typeof response)
        
        // API 返回的是按厂商分组的对象，需要转换为数组
        let modelArray: LLMModel[] = []
        if (response && typeof response === 'object' && !Array.isArray(response)) {
          // 遍历每个厂商的模型
          Object.values(response).forEach((providerModels: any) => {
            if (Array.isArray(providerModels)) {
              // 只添加 available 为 true 且 mdl_type 为 embedding 的模型
              const availableEmbeddingModels = providerModels.filter((model: any) => 
                model.available === true && model.mdl_type === 'embedding'
              )
              modelArray.push(...availableEmbeddingModels)
            }
          })
        }
        
        console.log('处理后的模型数组:', modelArray)
        setEmbeddingModels(modelArray)
        
        // 如果有可用模型，默认选择第一个
        if (modelArray.length > 0 && !formData.embd_id) {
          setFormData(prev => ({ ...prev, embd_id: modelArray[0].id }))
        }
      } catch (error: any) {
        console.error('Failed to load embedding models:', error)
        // 设置为空数组，防止 forEach 错误
        setEmbeddingModels([])
        setModelsError('无法加载向量模型列表')
        addNotification({
          type: 'error',
          title: '加载失败',
          message: '无法加载向量模型列表'
        })
      } finally {
        setIsLoadingModels(false)
      }
    }

    loadEmbeddingModels()
  }, [])

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleModelSelect = (modelId: string) => {
    const selectedModel = embeddingModels.find(model => model.id === modelId)
    if (selectedModel) {
      setFormData(prev => ({ ...prev, embd_id: selectedModel.llm_name }))
    }
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
    
    // 验证向量模型必选
    if (!formData.embd_id) {
      addNotification({
        type: 'error',
        title: '验证失败',
        message: '请选择向量模型'
      })
      return
    }

    try {
      setIsLoading(true)
      
      const createData: CreateKBRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        language: formData.language,
        permission: formData.permission,
        embd_id: formData.embd_id,
        parser_id: 'naive' // 默认使用 naive 解析器
      }

      console.log('创建知识库请求数据:', createData)
      const newKB = await createKnowledgeBase(createData)
      console.log('创建知识库成功:', newKB)
      
      addNotification({
        type: 'success',
        title: '创建成功',
        message: '知识库已成功创建'
      })
      
      // 导航到新创建的知识库详情页
      navigate(`${ROUTES.KNOWLEDGE}/${newKB.id}`)
    } catch (error: any) {
      console.error('Create knowledge base failed:', error)
      
      // 处理具体的后端错误消息
      let errorMessage = '创建知识库时发生错误'
      
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
        } else if (backendMessage.includes('null value in column "parser_id"')) {
          errorMessage = '系统配置错误：缺少解析器配置，请联系管理员'
        } else if (backendMessage.includes('IntegrityError')) {
          errorMessage = '数据库约束错误：请检查必填字段是否完整'
        } else {
          // 如果是其他后端错误，直接显示后端消息
          errorMessage = backendMessage
        }
      }
      
      addNotification({
        type: 'error',
        title: '创建失败',
        message: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    navigate(ROUTES.KNOWLEDGE)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 页面头部 */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">创建知识库</h1>
            <p className="text-gray-600 mt-1">
              创建一个新的知识库来管理和检索您的文档
            </p>
          </div>
        </div>
      </div>

      {/* 创建表单 */}
      <Card className="max-w-4xl mx-auto p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">
                知识库名称 *
              </label>
              <Tooltip content="知识库名称必须以字母开头，只能包含字母、数字和下划线">
                <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </Tooltip>
            </div>
            <Input
              value={formData.name}
              onChange={handleInputChange('name')}
              placeholder="例如：my_knowledge_base"
              required
            />
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">
                描述
              </label>
              <Tooltip content="简要描述知识库的用途和内容，便于后续管理">
                <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </Tooltip>
            </div>
            <textarea
              value={formData.description}
              onChange={handleInputChange('description')}
              placeholder="请输入知识库描述"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">
                语言
              </label>
              <Tooltip content="选择知识库主要文档的语言，影响文本处理和搜索效果">
                <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </Tooltip>
            </div>
            <CustomSelect
              options={languageOptions}
              value={formData.language}
              onChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
              placeholder="请选择语言"
            />
          </div>

          <EmbeddingModelSelector
            models={embeddingModels}
            selectedModelId={embeddingModels.find(m => m.llm_name === formData.embd_id)?.id || ''}
            onSelect={handleModelSelect}
            loading={isLoadingModels}
            error={modelsError}
          />

          <div>
            <div className="flex items-center space-x-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">
                权限设置
              </label>
              <Tooltip content="设置谁可以访问此知识库，可在创建后调整">
                <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </Tooltip>
            </div>
            <CustomSelect
              options={permissionOptions}
              value={formData.permission}
              onChange={(value) => setFormData(prev => ({ ...prev, permission: value as 'me' | 'team' }))}
              placeholder="请选择权限"
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              leftIcon={<Save className="h-4 w-4" />}
            >
              创建知识库
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}