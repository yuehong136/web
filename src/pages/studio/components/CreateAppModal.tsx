import React, { useState } from 'react'
import { Modal, Input, Avatar, Upload, Button, Space, Typography, message } from 'antd'
import { AppstoreOutlined, PlusOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useSetDialogApp } from '@/hooks/use-dialog-apps'
import { ROUTES } from '@/constants'

const { TextArea } = Input
const { Text } = Typography

interface CreateAppModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate?: (appData: { name: string; description: string; icon?: string }) => void
}

export const CreateAppModal: React.FC<CreateAppModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
  })
  
  const [nameError, setNameError] = useState<string | null>(null)
  const setDialogAppMutation = useSetDialogApp()

  const handleIconUpload: UploadProps['beforeUpload'] = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/svg+xml'
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG/SVG 格式的图片!')
      return false
    }
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB!')
      return false
    }

    // 转换为base64
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // 保留完整的data URL格式（包含data:image/...;base64,前缀）
      setFormData(prev => ({ ...prev, icon: result }))
    }
    reader.readAsDataURL(file)
    return false // 阻止自动上传
  }

  const validateName = (name: string): string | null => {
    if (name.trim() === '') {
      return '应用名称不能为空'
    }
    
    // 检查UTF-8字节长度是否超过255
    const byteLength = new TextEncoder().encode(name).length
    if (byteLength > 255) {
      return `应用名称过长（${byteLength}字节），请不要超过255字节`
    }
    
    return null
  }

  const handleCreate = () => {
    // 验证应用名称
    const nameError = validateName(formData.name)
    if (nameError) {
      message.error(nameError)
      return
    }
    
    if (!formData.description.trim()) {
      message.error('请输入应用描述')
      return
    }
    
    // 使用新的API创建应用
    setDialogAppMutation.mutate({
      name: formData.name,
      description: formData.description,
      icon: formData.icon, // 后端调整max_length后恢复发送图标数据
    }, {
      onSuccess: (createdApp) => {
        handleClose()
        // 跳转到应用配置页面
        const searchParams = new URLSearchParams({
          id: createdApp.id,
          name: formData.name,
          description: formData.description,
          ...(formData.icon && { icon: formData.icon })
        })
        navigate(`${ROUTES.STUDIO_CREATE_APP}?${searchParams.toString()}`)
        
        // 如果有回调函数，也调用它（兼容性）
        onCreate?.(formData)
      }
    })
  }

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, name: value }))
    setNameError(validateName(value))
  }

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
    })
    setNameError(null)
    onClose()
  }

  return (
    <Modal
      title="创建新应用"
      open={isOpen}
      onOk={handleCreate}
      onCancel={handleClose}
      okText="创建应用"
      cancelText="取消"
      width={500}
      destroyOnHidden
      confirmLoading={setDialogAppMutation.isPending}
    >
      <Space direction="vertical" className="w-full" size="large">
        <div>
          <Text strong className="block mb-3">应用图标</Text>
          <div className="flex items-center gap-4">
            <Avatar 
              size={64}
              src={formData.icon || undefined}
              icon={!formData.icon && <AppstoreOutlined />}
              className={formData.icon ? "bg-transparent" : "bg-gradient-to-br from-purple-500 to-blue-500"}
            />
            <div className="flex flex-col gap-2">
              <Upload
                beforeUpload={handleIconUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<PlusOutlined />}>
                  上传图标
                </Button>
              </Upload>
              {formData.icon && (
                <Button 
                  onClick={() => setFormData(prev => ({ ...prev, icon: '' }))}
                  type="text"
                  danger
                  size="small"
                >
                  移除图标
                </Button>
              )}
            </div>
          </div>
          <Text type="secondary" className="text-xs block mt-2">
            支持 JPG、PNG、SVG 格式，文件大小不超过 2MB
          </Text>
        </div>
        
        <div>
          <Text strong className="block mb-2">应用名称 *</Text>
          <Input
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="输入应用名称"
            status={nameError ? 'error' : ''}
          />
          {nameError && (
            <Text type="danger" className="text-xs block mt-1">
              {nameError}
            </Text>
          )}
          <Text type="secondary" className="text-xs block mt-1">
            最多255字节（中文字符约85个字）
          </Text>
        </div>
        
        <div>
          <Text strong className="block mb-2">应用描述 *</Text>
          <TextArea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="描述应用的功能和用途..."
            rows={4}
            maxLength={200}
            showCount
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <Text className="text-sm text-blue-700">
            <strong>提示：</strong>创建应用后，您将进入应用配置页面，可以设置模型参数、提示词模板、对话记忆等高级功能。
          </Text>
        </div>
      </Space>
    </Modal>
  )
}