import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, Upload, X, Database, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { useKnowledgeStore } from '@/stores/knowledge'
import { useUIStore } from '@/stores/ui'
import { llmAPI } from '@/api/llm'
import { ROUTES } from '@/constants'
import type { UpdateKBRequest, LLMModel } from '@/types/api'
import { DocumentParserType, DOCUMENT_PARSER_TYPE_LABELS, DOCUMENT_PARSER_TYPE_DESCRIPTIONS } from '@/types/document-parser'
import { ConfigurationRenderer } from './settings/configuration-mapping'
import ParserVisualizationPanel from './settings/ParserVisualizationPanel'
import { EmbeddingModelSelector } from '@/components/knowledge/EmbeddingModelSelector'
import { ParserTypeSelector } from '@/components/knowledge/ParserTypeSelector'

const KnowledgeSettingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentKnowledgeBase, updateKnowledgeBase } = useKnowledgeStore()
  const { addNotification } = useUIStore()

  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    permission: '',
    avatar: '',
    parser_id: '',
    embd_id: '',
    pagerank: 0,
    parser_config: {}
  })

  const [isLoading, setIsLoading] = React.useState(false)
  const [, setAvatarFile] = React.useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = React.useState<string>('')
  const [embeddingModels, setEmbeddingModels] = React.useState<LLMModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = React.useState(false)
  const [modelsError, setModelsError] = React.useState<string | undefined>()

  // 加载嵌入模型列表
  React.useEffect(() => {
    const loadEmbeddingModels = async () => {
      try {
        setIsLoadingModels(true)
        setModelsError(undefined)
        const response = await llmAPI.list({ 
          mdl_type: 'embedding',
          available: true 
        })
        
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
        
        setEmbeddingModels(modelArray)
      } catch (error: any) {
        console.error('Failed to load embedding models:', error)
        setEmbeddingModels([])
        setModelsError('无法加载嵌入模型列表')
        addNotification({
          type: 'error',
          title: '加载失败',
          message: '无法加载嵌入模型列表，请刷新页面重试'
        })
      } finally {
        setIsLoadingModels(false)
      }
    }

    loadEmbeddingModels()
  }, [addNotification])

  // 初始化表单数据
  React.useEffect(() => {
    if (currentKnowledgeBase) {
      setFormData({
        name: currentKnowledgeBase.name || '',
        description: currentKnowledgeBase.description || '',
        permission: currentKnowledgeBase.permission || '',
        avatar: currentKnowledgeBase.avatar || '',
        parser_id: currentKnowledgeBase.parser_id || '',
        embd_id: currentKnowledgeBase.embd_id || '',
        pagerank: currentKnowledgeBase.pagerank || 0,
        parser_config: currentKnowledgeBase.parser_config || {}
      })
      setAvatarPreview(currentKnowledgeBase.avatar || '')
    }
  }, [currentKnowledgeBase])

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      
      // 创建预览
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setAvatarPreview(result)
        setFormData(prev => ({ ...prev, avatar: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview('')
    setFormData(prev => ({ ...prev, avatar: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedName = formData.name.trim()
    
    if (!id || !trimmedName) {
      addNotification({
        type: 'error',
        title: '表单验证失败',
        message: '知识库名称不能为空'
      })
      return
    }

    // 根据后端接口验证名称长度（UTF-8字节长度）
    const nameByteLength = new TextEncoder().encode(trimmedName).length
    if (nameByteLength > 255) { // DATASET_NAME_LIMIT 通常是255
      addNotification({
        type: 'error',
        title: '表单验证失败',
        message: `知识库名称过长，当前${nameByteLength}字节，最大支持255字节`
      })
      return
    }

    // 验证PageRank值范围
    if (formData.pagerank < 0 || formData.pagerank > 100) {
      addNotification({
        type: 'error',
        title: '表单验证失败',
        message: 'PageRank权重必须在0-100之间'
      })
      return
    }

    try {
      setIsLoading(true)
      
      const updateData: UpdateKBRequest = {
        kb_id: id,
        name: trimmedName,
        description: formData.description?.trim() || null,
        permission: formData.permission || null,
        avatar: formData.avatar || null,
        parser_id: formData.parser_id || null,
        embd_id: formData.embd_id?.trim() || null,
        pagerank: formData.pagerank || 0,
        parser_config: Object.keys(formData.parser_config).length > 0 ? formData.parser_config : null
      }

      await updateKnowledgeBase(updateData)
      
      addNotification({
        type: 'success',
        title: '更新成功',
        message: '知识库设置已成功更新'
      })
    } catch (error) {
      console.error('Update knowledge base failed:', error)
      addNotification({
        type: 'error',
        title: '更新失败',
        message: '更新知识库设置时发生错误'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (currentKnowledgeBase) {
      setFormData({
        name: currentKnowledgeBase.name || '',
        description: currentKnowledgeBase.description || '',
        permission: currentKnowledgeBase.permission || '',
        avatar: currentKnowledgeBase.avatar || '',
        parser_id: currentKnowledgeBase.parser_id || '',
        embd_id: currentKnowledgeBase.embd_id || '',
        pagerank: currentKnowledgeBase.pagerank || 0,
        parser_config: currentKnowledgeBase.parser_config || {}
      })
      setAvatarPreview(currentKnowledgeBase.avatar || '')
      setAvatarFile(null)
    }
  }

  if (!currentKnowledgeBase) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">知识库不存在</p>
          <Button 
            className="mt-4"
            onClick={() => navigate(ROUTES.KNOWLEDGE)}
          >
            返回知识库列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col overflow-hidden">
      {/* 固定头部操作栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <Settings2 className="h-5 w-5 text-blue-500 mr-2" />
              知识库设置
            </h1>
            <p className="text-sm text-gray-500 mt-1">配置解析方式和参数选项</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              重置
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              leftIcon={<Save className="h-4 w-4" />}
              onClick={handleSubmit}
            >
              保存设置
            </Button>
          </div>
        </div>
      </div>

      {/* 内容区域 - 无滚动 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-6 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* 左侧配置面板，占2/3宽度 - 智能滚动条 */}
            <div className="lg:col-span-2 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto scrollbar-thin pr-2 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 基本信息 */}
              <Card className="p-6">
                <div className="flex items-center mb-4">
                  <Settings2 className="h-5 w-5 text-blue-500 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>
                </div>
          
                <div className="space-y-4">
                  {/* 头像上传区域 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      知识库头像
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar 
                          src={avatarPreview}
                          alt={formData.name}
                          size="xl"
                          fallback={<Database className="h-8 w-8" />}
                          className="ring-4 ring-white shadow-lg"
                        />
                        {avatarPreview && (
                          <button
                            type="button"
                            onClick={removeAvatar}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                          leftIcon={<Upload className="h-4 w-4" />}
                        >
                          上传头像
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          支持 JPG, PNG 格式，建议尺寸 128x128 像素
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 基本信息字段 */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        知识库名称 *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={handleInputChange('name')}
                        placeholder="请输入知识库名称"
                        required
                        className="h-8 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        访问权限
                      </label>
                      <select
                        value={formData.permission}
                        onChange={handleInputChange('permission')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 h-8 text-xs"
                      >
                        <option value="">请选择访问权限</option>
                        <option value="me">仅我可见</option>
                        <option value="team">团队可见</option>
                        <option value="public">公开访问</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        描述信息
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={handleInputChange('description')}
                        placeholder="请输入知识库描述"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-xs"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* 解析器和模型配置 */}
              <Card className="p-6">
                <div className="flex items-center mb-4">
                  <Database className="h-5 w-5 text-purple-500 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">解析器和模型配置</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <ParserTypeSelector
                      selectedParserId={formData.parser_id}
                      onSelect={(parserId) => setFormData(prev => ({ ...prev, parser_id: parserId || '' }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <EmbeddingModelSelector
                        models={embeddingModels}
                        selectedModelId={formData.embd_id}
                        onSelect={(modelId) => setFormData(prev => ({ ...prev, embd_id: modelId || '' }))}
                        loading={isLoadingModels}
                        error={modelsError}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        PageRank权重
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.pagerank}
                        onChange={handleInputChange('pagerank')}
                        placeholder="0"
                        className="h-8 text-xs"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        文档重要性权重 (0-100，仅Elasticsearch支持)
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 解析器配置 */}
              {formData.parser_id && (
                <Card className="p-6">
                  <div className="flex items-center mb-4">
                    <Settings2 className="h-5 w-5 text-green-500 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {DOCUMENT_PARSER_TYPE_LABELS[formData.parser_id as DocumentParserType]}配置参数
                    </h2>
                  </div>
                  <ConfigurationRenderer parserId={formData.parser_id} />
                </Card>
              )}

            </form>
              </div>
            </div>

            {/* 右侧可视化面板，占1/3宽度 - 独立滚动 */}
            <div className="lg:col-span-1 flex flex-col overflow-hidden">
              <Card className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-hidden">
                  <ParserVisualizationPanel selectedParser={formData.parser_id} />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { KnowledgeSettingsPage }