import React, { useMemo } from 'react'
import { LLMFactory, IconMap } from '@/stores/model'
import { useIsDarkTheme } from '@/themes'
import { cn } from '@/lib/utils'
import { IconFontFill } from './icon-font'

/**
 * 需要根据主题切换图标的厂商（有 -dark/-bright 版本的图标）
 * 参考 ragflow 的实现
 */
const THEME_AWARE_FACTORIES = [
  LLMFactory.FishAudio,
  LLMFactory.TogetherAI,
  LLMFactory.Meituan,
  LLMFactory.Longcat,
  LLMFactory.MinerU,
]

/**
 * 使用独立 SVG 文件的厂商（不在 iconfont 中）
 * 参考 ragflow 的 svgIcons 列表
 */
const SVG_FILE_FACTORIES = [
  LLMFactory.LocalAI,
  LLMFactory.Gemini,
  LLMFactory.StepFun,
  LLMFactory.MinerU,
]

interface ProviderIconProps {
  provider: string
  className?: string
  size?: number
}

/**
 * LLM 供应商图标组件
 * 参考 ragflow 的 LlmIcon 组件实现
 * 使用 iconfont 方式渲染图标
 */
export const ProviderIcon: React.FC<ProviderIconProps> = ({ 
  provider, 
  className = 'w-6 h-6', 
  size = 24 
}) => {
  const isDark = useIsDarkTheme()
  
  // 获取图标名称，支持主题切换
  const iconName = useMemo(() => {
    const baseIcon = IconMap[provider as keyof typeof IconMap]
    if (!baseIcon) return null
    
    // 检查是否需要根据主题切换图标
    if (THEME_AWARE_FACTORIES.includes(provider as any)) {
      return isDark ? `${baseIcon}-dark` : `${baseIcon}-bright`
    }
    
    return baseIcon
  }, [provider, isDark])
  
  // 检查是否是使用独立 SVG 文件的厂商
  const useSvgFile = SVG_FILE_FACTORIES.includes(provider as any)
  
  // 如果使用独立 SVG 文件
  if (useSvgFile && iconName) {
    return (
      <div className={cn(className, 'flex items-center justify-center')} style={{ width: size, height: size }}>
        <img 
          src={`/src/assets/svg/llm/${iconName}.svg`}
          alt={provider}
          className="w-full h-full object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
      </div>
    )
  }
  
  // 使用 iconfont
  if (iconName) {
    return (
      <IconFontFill
        name={iconName}
        className={cn('flex items-center justify-center', className)}
      />
    )
  }
  
  // 默认图标（未找到匹配的厂商）
  return (
    <IconFontFill
      name="moxing-default"
      className={cn('flex items-center justify-center', className)}
    />
  )
}

/**
 * 获取厂商图标名称
 * 用于其他组件需要图标名称的场景
 */
export const getProviderIconName = (provider: string, isDark: boolean = false): string | null => {
  const baseIcon = IconMap[provider as keyof typeof IconMap]
  if (!baseIcon) {
    // 尝试模糊匹配
    const lowerProvider = provider.toLowerCase()
    for (const [factoryKey, factoryName] of Object.entries(LLMFactory)) {
      if (lowerProvider.includes(factoryName.toLowerCase()) || 
          lowerProvider.includes(factoryKey.toLowerCase())) {
        const icon = IconMap[factoryName]
        if (icon) {
          // 检查是否需要主题切换
          if (THEME_AWARE_FACTORIES.includes(factoryName as any)) {
            return isDark ? `${icon}-dark` : `${icon}-bright`
          }
          return icon
        }
      }
    }
    return null
  }
  
  // 检查是否需要根据主题切换图标
  if (THEME_AWARE_FACTORIES.includes(provider as any)) {
    return isDark ? `${baseIcon}-dark` : `${baseIcon}-bright`
  }
  
  return baseIcon
}

/**
 * 判断是否使用独立 SVG 文件
 */
export const usesSvgFile = (provider: string): boolean => {
  return SVG_FILE_FACTORIES.includes(provider as any)
}

/**
 * 获取 SVG 文件路径（仅用于使用独立 SVG 的厂商）
 * @deprecated 建议使用 ProviderIcon 组件代替
 */
export const getProviderIconPath = (provider: string, isDark: boolean = false): string | null => {
  const iconName = getProviderIconName(provider, isDark)
  if (!iconName) return null
  
  // 如果使用独立 SVG 文件
  if (usesSvgFile(provider)) {
    return `/src/assets/svg/llm/${iconName}.svg`
  }
  
  // 对于 iconfont 图标，返回 null（应该使用 ProviderIcon 组件）
  return null
}

/**
 * 判断给定厂商是否需要在暗黑模式下反色
 * @deprecated iconfont 方式不需要此函数，保留仅为兼容性
 */
export const needsInvertFilter = (_provider: string, _isDark: boolean): boolean => {
  // iconfont 方式自动支持主题切换，不需要反色滤镜
  return false
}

/**
 * 获取厂商图标的 React 节点
 * 用于在非组件上下文中获取图标（如消息列表等）
 */
export const getProviderIcon = (modelName: string | null): React.ReactNode => {
  if (!modelName) {
    return (
      <IconFontFill
        name="moxing-default"
        className="flex items-center justify-center w-full h-full"
      />
    )
  }
  
  // 获取图标名称
  const iconName = getProviderIconName(modelName, false)
  
  if (iconName) {
    // 检查是否使用独立 SVG 文件
    if (usesSvgFile(modelName)) {
      return (
        <img 
          src={`/src/assets/svg/llm/${iconName}.svg`}
          alt={modelName}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
      )
    }
    
    // 使用 iconfont
    return (
      <IconFontFill
        name={iconName}
        className="flex items-center justify-center w-full h-full"
      />
    )
  }
  
  // 默认图标
  return (
    <IconFontFill
      name="moxing-default"
      className="flex items-center justify-center w-full h-full"
    />
  )
}

/**
 * 获取模型显示名称
 */
export const getModelDisplayName = (modelName: string | null): string => {
  if (!modelName) return 'AI Assistant'
  
  // 简化模型名显示
  const parts = modelName.split('/')
  return parts[parts.length - 1] || modelName
}
