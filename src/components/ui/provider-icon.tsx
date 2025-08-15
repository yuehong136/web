import React from 'react'
import { UserOutlined } from '@ant-design/icons'
import { LLMFactory, IconMap } from '@/stores/model'

interface ProviderIconProps {
  provider: string
  className?: string
  size?: number
}

export const ProviderIcon: React.FC<ProviderIconProps> = ({ 
  provider, 
  className = 'w-6 h-6', 
  size = 24 
}) => {
  // 使用统一的工具函数获取图标路径
  const iconPath = getProviderIconPath(provider)
  
  // 如果没有找到匹配的厂商，返回默认图标
  if (!iconPath) {
    return <UserOutlined style={{ fontSize: size }} className={className} />
  }
  
  return (
    <div className={className} style={{ width: size, height: size }}>
      <img 
        src={iconPath} 
        alt={provider} 
        className="w-full h-full object-contain"
        onError={(e) => {
          // 如果图片加载失败，显示默认图标
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          target.parentNode?.appendChild(
            Object.assign(document.createElement('span'), {
              innerHTML: '👤',
              className: 'flex items-center justify-center w-full h-full text-gray-400'
            })
          )
        }}
      />
    </div>
  )
}

// 获取厂商图标文件名的工具函数
export const getProviderIconName = (provider: string): string | null => {
  const lowerProvider = provider.toLowerCase()
  
  // 遍历LLMFactory来查找匹配的厂商
  for (const [factoryKey, factoryName] of Object.entries(LLMFactory)) {
    if (lowerProvider.includes(factoryName.toLowerCase()) || 
        lowerProvider.includes(factoryKey.toLowerCase()) ||
        factoryName.toLowerCase().includes(lowerProvider.split('/')[0]) ||
        factoryName.toLowerCase().includes(lowerProvider.split('-')[0])) {
      return IconMap[factoryName]
    }
  }
  
  // 额外的兜底匹配逻辑
  const extraMappings: Record<string, string> = {
    'gpt': IconMap[LLMFactory.OpenAI],
    'claude': IconMap[LLMFactory.Anthropic],
    'gemini': IconMap[LLMFactory.Gemini],
    'qwen': IconMap[LLMFactory.TongYiQianWen],
    'kimi': IconMap[LLMFactory.Moonshot],
    'glm': IconMap[LLMFactory.ZhipuAI],
    'ernie': IconMap[LLMFactory.WenXinYiYan],
    'spark': IconMap[LLMFactory.XunFeiSpark],
    'yi': IconMap[LLMFactory.ZeroOneAI],
  }
  
  for (const [key, iconName] of Object.entries(extraMappings)) {
    if (lowerProvider.includes(key)) {
      return iconName
    }
  }
  
  return null
}

// 获取厂商图标路径的工具函数
export const getProviderIconPath = (provider: string): string | null => {
  const iconName = getProviderIconName(provider)
  return iconName ? `/src/assets/svg/llm/${iconName}.svg` : null
}

// 获取厂商图标的简化函数
export const getProviderIcon = (modelName: string | null): React.ReactNode => {
  if (!modelName) return <UserOutlined />
  
  // 先尝试获取图标路径
  const iconPath = getProviderIconPath(modelName)
  
  // 如果有图标路径，返回img元素，否则返回默认图标
  if (iconPath) {
    return (
      <img 
        src={iconPath} 
        alt={modelName}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onError={(e) => {
          // 如果图片加载失败，替换为默认图标
          console.warn(`Failed to load icon for ${modelName}:`, iconPath)
          const target = e.target as HTMLImageElement
          target.style.display = 'none'
          if (target.parentNode) {
            target.parentNode.innerHTML = '<span style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 14px;">AI</span>'
          }
        }}
      />
    )
  }
  
  return <UserOutlined />
}

// 获取模型显示名称
export const getModelDisplayName = (modelName: string | null): string => {
  if (!modelName) return 'AI Assistant'
  
  // 简化模型名显示
  const parts = modelName.split('/')
  return parts[parts.length - 1] || modelName
} 