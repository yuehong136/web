/**
 * 创建知识库页面
 * 现代化 AI 产品风格设计，遵循语义令牌规范
 */

import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Database, HelpCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip } from '@/components/ui/tooltip'
import { CustomSelect } from '@/components/ui/custom-select'
import { EmbeddingModelSelector } from '@/components/knowledge/EmbeddingModelSelector'
import { useKnowledgeStore } from '@/stores/knowledge'
import { useUIStore } from '@/stores/ui'
import { ROUTES } from '@/constants'
import { cn } from '@/lib/utils'
import type { CreateKBRequest } from '@/types/api'

// 语言选项
const languageOptions = [
  { value: 'Chinese', label: '中文', icon: '🇨🇳' },
  { value: 'English', label: '英文', icon: '🇺🇸' },
  { value: 'Japanese', label: '日文', icon: '🇯🇵' },
  { value: 'Korean', label: '韩文', icon: '🇰🇷' }
]

// 权限选项
const permissionOptions = [
  { value: 'me', label: '仅自己可见', icon: '🔒' },
  { value: 'team', label: '团队可见', icon: '👥' }
]

// 名称验证正则
const NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/
const MAX_NAME_LENGTH = 100

export const KnowledgeCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const { createKnowledgeBase } = useKnowledgeStore()
  const { addNotification } = useUIStore()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    language: 'Chinese',
    permission: 'me' as 'me' | 'team',
    embd_id: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  // 验证名称
  const validateName = useCallback((name: string): string | null => {
    const trimmed = name.trim()
    if (!trimmed) {
      return '知识库名称不能为空'
    }
    if (!NAME_PATTERN.test(trimmed)) {
      return '名称必须以字母开头，只能包含字母、数字和下划线'
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      return `名称长度不能超过 ${MAX_NAME_LENGTH} 个字符`
    }
    return null
  }, [])

  // 处理名称变化
  const handleNameChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, name: value }))
    if (value) {
      setNameError(validateName(value))
    } else {
      setNameError(null)
    }
  }, [validateName])

  // 处理模型选择
  const handleModelSelect = useCallback((modelId: string | null) => {
    setFormData(prev => ({ ...prev, embd_id: modelId || '' }))
  }, [])

  // 处理提交
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    const name = formData.name.trim()
    
    // 验证名称
    const error = validateName(name)
    if (error) {
      setNameError(error)
      addNotification({ type: 'error', title: '验证失败', message: error })
      return
    }
    
    // 验证向量模型
    if (!formData.embd_id) {
      addNotification({ type: 'error', title: '验证失败', message: '请选择向量模型' })
      return
    }

    try {
      setIsLoading(true)
      
      const createData: CreateKBRequest = {
        name,
        description: formData.description.trim() || undefined,
        language: formData.language,
        permission: formData.permission,
        embd_id: formData.embd_id,
        parser_id: 'naive'
      }

      const newKB = await createKnowledgeBase(createData)
      
      addNotification({
        type: 'success',
        title: '创建成功',
        message: '知识库已成功创建'
      })
      
      navigate(`${ROUTES.KNOWLEDGE}/${newKB.id}`)
    } catch (error: any) {
      console.error('Create knowledge base failed:', error)
      
      let errorMessage = '创建知识库时发生错误'
      
      if (error?.response?.data?.retmsg) {
        const backendMessage = error.response.data.retmsg
        
        if (backendMessage.includes('Dataset name must be string')) {
          errorMessage = '知识库名称必须是字符串格式'
        } else if (backendMessage.includes('Dataset name can\'t be empty')) {
          errorMessage = '知识库名称不能为空'
        } else if (backendMessage.includes('Dataset name length is')) {
          errorMessage = '知识库名称长度超出限制，请使用更短的名称'
        } else if (backendMessage.includes('Dataset name must start with a letter')) {
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
          errorMessage = backendMessage
        }
      }
      
      addNotification({ type: 'error', title: '创建失败', message: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }, [formData, validateName, createKnowledgeBase, addNotification, navigate])

  const handleCancel = useCallback(() => {
    navigate(ROUTES.KNOWLEDGE)
  }, [navigate])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background-body)' }}>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="mb-4 gap-2 text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                'bg-gradient-to-br from-components-avatar-gradient-indigo-from to-components-avatar-gradient-indigo-to',
                'shadow-sm'
              )}
            >
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">
                创建知识库
              </h1>
              <p className="text-text-secondary mt-1">
                创建一个新的知识库来管理和检索您的文档
              </p>
            </div>
          </div>
        </div>

        {/* 创建表单卡片 */}
        <Card
          className="overflow-hidden"
          style={{
            backgroundColor: 'var(--color-components-card-bg)',
            borderColor: 'var(--color-components-card-border)',
          }}
        >
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* 知识库名称 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-text-primary">
                    知识库名称 <span className="text-state-error">*</span>
                  </Label>
                  <Tooltip content="名称必须以字母开头，只能包含字母、数字和下划线">
                    <HelpCircle className="h-4 w-4 text-text-tertiary hover:text-text-secondary cursor-help" />
                  </Tooltip>
                </div>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="例如：my_knowledge_base"
                  disabled={isLoading}
                  className={cn(nameError && 'border-state-error')}
                />
                {nameError && (
                  <p className="text-xs text-state-error">{nameError}</p>
                )}
                <p className="text-xs text-text-tertiary">
                  以字母开头，只能包含字母、数字和下划线，最长 100 个字符
                </p>
              </div>

              {/* 描述 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-text-primary">
                    描述
                  </Label>
                  <Tooltip content="简要描述知识库的用途和内容，便于后续管理">
                    <HelpCircle className="h-4 w-4 text-text-tertiary hover:text-text-secondary cursor-help" />
                  </Tooltip>
                </div>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="请输入知识库描述"
                  rows={4}
                  disabled={isLoading}
                />
              </div>

              {/* 语言选择 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-text-primary">
                    语言
                  </Label>
                  <Tooltip content="选择知识库主要文档的语言，影响文本处理和搜索效果">
                    <HelpCircle className="h-4 w-4 text-text-tertiary hover:text-text-secondary cursor-help" />
                  </Tooltip>
                </div>
                <CustomSelect
                  options={languageOptions}
                  value={formData.language}
                  onChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                  placeholder="请选择语言"
                  disabled={isLoading}
                />
              </div>

              {/* 向量模型选择器 */}
              <EmbeddingModelSelector
                selectedModelId={formData.embd_id || null}
                onSelect={handleModelSelect}
              />

              {/* 权限设置 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-text-primary">
                    权限设置
                  </Label>
                  <Tooltip content="设置谁可以访问此知识库，可在创建后调整">
                    <HelpCircle className="h-4 w-4 text-text-tertiary hover:text-text-secondary cursor-help" />
                  </Tooltip>
                </div>
                <CustomSelect
                  options={permissionOptions}
                  value={formData.permission}
                  onChange={(value) => setFormData(prev => ({ ...prev, permission: value as 'me' | 'team' }))}
                  placeholder="请选择权限"
                  disabled={isLoading}
                />
              </div>

              {/* 提示信息 */}
              <div
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{
                  backgroundColor: 'var(--color-state-info-subtle)',
                }}
              >
                <Sparkles className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'var(--color-state-info)' }} />
                <div>
                  <p className="text-sm font-medium text-text-primary mb-1">
                    提示
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    创建知识库后，您可以上传文档进行解析和向量化处理，然后在应用中引用该知识库进行检索增强生成。
                  </p>
                </div>
              </div>
            </div>

            {/* 底部操作栏 */}
            <div
              className="flex items-center justify-end gap-3 px-6 py-4 border-t"
              style={{
                borderColor: 'var(--color-border-default)',
                backgroundColor: 'var(--color-background-subtle)',
              }}
            >
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
                disabled={isLoading || !formData.name || !formData.embd_id}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    创建知识库
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
