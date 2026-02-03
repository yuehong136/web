/**
 * 创建知识库弹窗
 * 现代化 AI 产品风格设计，遵循语义令牌规范
 */

import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, HelpCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

interface CreateKnowledgeModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (kbId: string) => void
}

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

export const CreateKnowledgeModal: React.FC<CreateKnowledgeModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
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

  // 重置表单
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      language: 'Chinese',
      permission: 'me',
      embd_id: ''
    })
    setNameError(null)
  }, [])

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

  // 处理关闭
  const handleClose = useCallback(() => {
    if (!isLoading) {
      resetForm()
      onClose()
    }
  }, [isLoading, resetForm, onClose])

  // 处理提交
  const handleSubmit = useCallback(async () => {
    const name = formData.name.trim()
    
    // 验证名称
    const error = validateName(name)
    if (error) {
      setNameError(error)
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
      
      resetForm()
      onClose()
      
      // 回调或导航
      if (onSuccess) {
        onSuccess(newKB.id)
      } else {
        navigate(`${ROUTES.KNOWLEDGE}/${newKB.id}`)
      }
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
          errorMessage = '知识库名称长度超出限制'
        } else if (backendMessage.includes('Dataset name must start with a letter')) {
          errorMessage = '知识库名称必须以字母开头，只能包含字母、数字和下划线'
        } else if (backendMessage.includes('已存在该知识库名')) {
          errorMessage = '该知识库名称已存在，请使用其他名称'
        } else if (backendMessage.includes('Tenant not found')) {
          errorMessage = '用户信息未找到，请重新登录'
        } else {
          errorMessage = backendMessage
        }
      }
      
      addNotification({ type: 'error', title: '创建失败', message: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }, [formData, validateName, createKnowledgeBase, addNotification, navigate, resetForm, onClose, onSuccess])

  const canSubmit = formData.name.trim() && formData.embd_id && !nameError

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="lg" className="overflow-hidden max-h-[90vh]">
        <DialogHeader className="pb-0">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                'bg-gradient-to-br from-components-avatar-gradient-indigo-from to-components-avatar-gradient-indigo-to'
              )}
            >
              <Database className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold text-text-primary">
                创建知识库
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                创建一个新的知识库来管理和检索您的文档
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[calc(90vh-200px)]">
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSubmit && !isLoading) {
                  handleSubmit()
                }
              }}
              autoFocus
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
              rows={3}
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
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{
              backgroundColor: 'var(--color-state-info-subtle)',
            }}
          >
            <Sparkles className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--color-state-info)' }} />
            <p className="text-xs text-text-secondary leading-relaxed">
              <strong className="text-text-primary">提示：</strong>
              创建知识库后，您可以上传文档进行解析和向量化处理，然后在应用中引用该知识库进行检索增强生成。
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
            className="gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                创建中...
              </>
            ) : (
              <>
                创建
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
