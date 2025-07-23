import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, Upload, X, Database } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'
import { Avatar } from '../../components/ui/avatar'
import { useKnowledgeStore } from '../../stores/knowledge'
import { useUIStore } from '../../stores/ui'
import { ROUTES } from '../../constants'
import type { UpdateKBRequest } from '../../types/api'

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
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = React.useState<string>('')

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
    
    if (!id || !formData.name.trim()) {
      addNotification({
        type: 'error',
        title: '表单验证失败',
        message: '知识库名称不能为空'
      })
      return
    }

    try {
      setIsLoading(true)
      
      const updateData: UpdateKBRequest = {
        kb_id: id,
        name: formData.name.trim(),
        description: formData.description || null,
        permission: formData.permission || null,
        avatar: formData.avatar || null,
        parser_id: formData.parser_id || null,
        embd_id: formData.embd_id || null,
        pagerank: formData.pagerank || null,
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
    <div className="p-6 max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                头像
              </label>
              <div className="flex items-center space-x-4">
                <Avatar 
                  src={avatarPreview}
                  alt={formData.name}
                  size="xl"
                  fallback={<Database className="h-6 w-6" />}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
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
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      上传头像
                    </Button>
                    {avatarPreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeAvatar}
                      >
                        <X className="h-4 w-4 mr-2" />
                        移除
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    支持 JPG, PNG 格式，建议尺寸 64x64 像素
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                知识库名称 *
              </label>
              <Input
                value={formData.name}
                onChange={handleInputChange('name')}
                placeholder="请输入知识库名称"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                权限设置
              </label>
              <select
                value={formData.permission}
                onChange={handleInputChange('permission')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">请选择权限</option>
                <option value="me">仅我可见</option>
                <option value="team">团队可见</option>
                <option value="public">公开</option>
              </select>
            </div>

            <div className="md:col-span-2">
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
          </div>
        </Card>

        {/* 高级设置 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">高级设置</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                解析器ID
              </label>
              <Input
                value={formData.parser_id}
                onChange={handleInputChange('parser_id')}
                placeholder="naive"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                嵌入模型ID
              </label>
              <Input
                value={formData.embd_id}
                onChange={handleInputChange('embd_id')}
                placeholder="text-embedding-ada-002"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PageRank权重
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.pagerank}
                onChange={handleInputChange('pagerank')}
                placeholder="0"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              解析配置 (JSON格式)
            </label>
            <textarea
              value={JSON.stringify(formData.parser_config, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value)
                  setFormData(prev => ({ ...prev, parser_config: parsed }))
                } catch (error) {
                  // 忽略JSON解析错误，让用户继续输入
                }
              }}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              placeholder="输入JSON格式的解析配置"
            />
          </div>
        </Card>

        {/* 操作按钮 */}
        <div className="flex items-center justify-end space-x-4">
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
            保存设置
          </Button>
        </div>
      </form>
    </div>
  )
}

export { KnowledgeSettingsPage }