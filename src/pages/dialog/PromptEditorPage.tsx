import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor/nohighlight'
import { Save, ArrowLeft, Eye, Edit3 } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { dialogAPI } from '@/api/dialog'
import { toast } from '@/lib/toast'
import type { DialogApp } from '@/types/api'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

const PromptEditorPage: React.FC = () => {
  const { id: dialogId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [dialog, setDialog] = useState<DialogApp | null>(null)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    const fetchDialog = async () => {
      if (!dialogId) return

      try {
        setLoading(true)
        const response = await dialogAPI.getDetail(dialogId)
        setDialog(response)
        setSystemPrompt(response.prompt_config.system || '')
      } catch (error) {
        console.error('Failed to fetch dialog:', error)
        toast.error('获取对话配置失败')
        navigate('/dialogs')
      } finally {
        setLoading(false)
      }
    }

    fetchDialog()
  }, [dialogId, navigate])

  const handleSave = async () => {
    if (!dialog || !dialogId) return

    try {
      setSaving(true)

      // 更新系统提示词
      const updatedDialog = await dialogAPI.updateSystemPrompt(
        dialogId,
        systemPrompt,
      )
      setDialog(updatedDialog)

      toast.success('系统提示词保存成功')
    } catch (error) {
      console.error('Failed to save prompt:', error)
      toast.error('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    navigate('/dialogs')
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-text-tertiary">加载中...</p>
        </div>
      </div>
    )
  }

  if (!dialog) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-text-tertiary">未找到对话配置</p>
          <Button onClick={handleBack}>返回列表</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background-subtle">
      {/* 顶部导航栏 */}
      <div className="border-b border-border-default bg-background-surface px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              返回
            </Button>
            <div className="h-6 w-px bg-border-default" />
            <div>
              <h1 className="text-xl font-semibold text-text-primary">
                编辑系统提示词
              </h1>
              <p className="mt-1 text-sm text-text-tertiary">
                对话应用: {dialog.name}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className={previewMode ? 'bg-blue-50 text-blue-600' : ''}
            >
              {previewMode ? (
                <>
                  <Edit3 className="mr-1 h-4 w-4" />
                  编辑模式
                </>
              ) : (
                <>
                  <Eye className="mr-1 h-4 w-4" />
                  预览模式
                </>
              )}
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={saving}>
              <Save className="mr-1 h-4 w-4" />
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-hidden p-6">
        <Card className="flex h-full flex-col">
          <div className="border-b border-border-default p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-text-primary">
                  系统提示词 (System Prompt)
                </h2>
                <p className="mt-1 text-sm text-text-tertiary">
                  定义AI助手的角色、行为和回答风格。支持Markdown格式。
                </p>
              </div>
              <div className="text-xs text-text-muted">
                字符数: {systemPrompt.length}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-4">
            <div className="h-full">
              <MDEditor
                value={systemPrompt}
                onChange={(value) => setSystemPrompt(value || '')}
                preview={previewMode ? 'preview' : 'edit'}
                hideToolbar={previewMode}
                visibleDragbar={false}
                data-color-mode="light"
                height="100%"
                className="h-full"
                textareaProps={{
                  placeholder:
                    '请输入系统提示词...\n\n例如：\n你是一个专业的AI助手，具有以下特点：\n- 友好和耐心\n- 提供准确和有用的信息\n- 使用清晰简洁的语言\n\n请根据用户的问题提供最佳回答。',
                  style: {
                    fontSize: 14,
                    lineHeight: 1.6,
                    fontFamily:
                      'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  },
                }}
              />
            </div>
          </div>

          {/* 底部提示信息 */}
          <div className="border-t border-border-default bg-background-subtle p-4">
            <div className="flex items-center justify-between text-sm text-text-tertiary">
              <div className="flex items-center space-x-4">
                <span>💡 提示: 支持Markdown语法</span>
                <span>📝 字符限制: 建议控制在2000字符以内</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="flex items-center">
                  <span className="mr-1 h-2 w-2 rounded-full bg-green-400"></span>
                  已同步
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export { PromptEditorPage }
