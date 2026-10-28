import React, { useMemo, useState } from 'react'
import { Boxes } from 'lucide-react'
import { LLMFactory, IconMap } from '@/stores/model'
import { useIsDarkTheme } from '@/themes'
import { cn } from '@/lib/utils'
import { IconFontFill } from './icon-font'

// Let Vite publish SVG URLs; source-directory paths do not exist in production.
const providerLogoUrls = import.meta.glob<string>(
  '/src/assets/svg/llm/{local-ai,gemini,stepfun,wenxin,yi,youdao,baai,nomic-ai,sentence-transformers,aimlapi,astraflow,fastembed,funasr,futurmix,greenpt,grok,huaweicloud,mws,new-api,orcarouter,qiniu,somark,tokenhub,xiaomi,mineru-bright,mineru-dark,paddleocr,n1n,jiekouai,avian,ragcon,perplexity-bright,perplexity-dark}.svg',
  { eager: true, query: '?url', import: 'default' },
)

const providerLogoUrl = (iconName: string) =>
  providerLogoUrls[`/src/assets/svg/llm/${iconName}.svg`]

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
  LLMFactory.MinerUNet,
  LLMFactory.Perplexity,
]

interface ProviderIconProps {
  provider: string
  className?: string
  size?: number
}

function ProviderLogoImage({
  url,
  provider,
  className,
  size,
}: {
  url: string
  provider: string
  className: string
  size?: number
}) {
  const [failed, setFailed] = useState(false)
  return (
    <span
      className={cn(
        className,
        'inline-flex shrink-0 items-center justify-center',
      )}
      style={size === undefined ? undefined : { width: size, height: size }}
    >
      {failed ? (
        <Boxes aria-hidden className="size-full text-text-secondary" />
      ) : (
        <img
          src={url}
          alt={provider}
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  )
}

/**
 * LLM 供应商图标组件
 * 参考 ragflow 的 LlmIcon 组件实现
 * 优先使用已注册的 SVG 资源，其他已知厂商使用 iconfont。
 */
export const ProviderIcon: React.FC<ProviderIconProps> = ({
  provider,
  className = 'w-6 h-6',
  size = 24,
}) => {
  const isDark = useIsDarkTheme()

  const iconName = useMemo(
    () => getProviderIconName(provider, isDark),
    [provider, isDark],
  )
  const url = iconName ? providerLogoUrl(iconName) : undefined
  if (url)
    return (
      <ProviderLogoImage
        key={url}
        url={url}
        provider={provider}
        className={className}
        size={size}
      />
    )

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
    <Boxes
      aria-hidden
      className={cn('shrink-0 text-text-secondary', className)}
    />
  )
}

/**
 * 获取厂商图标名称
 * 用于其他组件需要图标名称的场景
 */
export const getProviderIconName = (
  provider: string,
  isDark: boolean = false,
): string | null => {
  const baseIcon = IconMap[provider as keyof typeof IconMap]
  if (!baseIcon) {
    // 尝试模糊匹配
    const lowerProvider = provider.toLowerCase()
    for (const [factoryKey, factoryName] of Object.entries(LLMFactory)) {
      if (
        lowerProvider.includes(factoryName.toLowerCase()) ||
        lowerProvider.includes(factoryKey.toLowerCase())
      ) {
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
  return [false, true].some((dark) => {
    const name = getProviderIconName(provider, dark)
    return name ? !!providerLogoUrl(name) : false
  })
}

/**
 * 获取 SVG 文件路径（仅用于使用独立 SVG 的厂商）
 * @deprecated 建议使用 ProviderIcon 组件代替
 */
export const getProviderIconPath = (
  provider: string,
  isDark: boolean = false,
): string | null => {
  const iconName = getProviderIconName(provider, isDark)
  if (!iconName) return null

  // 如果使用独立 SVG 文件
  if (usesSvgFile(provider)) {
    return providerLogoUrl(iconName) ?? null
  }

  // 对于 iconfont 图标，返回 null（应该使用 ProviderIcon 组件）
  return null
}

/**
 * 判断给定厂商是否需要在暗黑模式下反色
 * @deprecated iconfont 方式不需要此函数，保留仅为兼容性
 */
export const needsInvertFilter = (
  _provider: string,
  _isDark: boolean,
): boolean => {
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
        className="flex h-full w-full items-center justify-center"
      />
    )
  }

  // 获取图标名称
  const iconName = getProviderIconName(modelName, false)

  if (iconName) {
    // 检查是否使用独立 SVG 文件
    if (usesSvgFile(modelName)) {
      const url = providerLogoUrl(iconName)
      if (url)
        return (
          <ProviderLogoImage
            key={url}
            url={url}
            provider={modelName}
            className="h-full w-full"
          />
        )
    }

    // 使用 iconfont
    return (
      <IconFontFill
        name={iconName}
        className="flex h-full w-full items-center justify-center"
      />
    )
  }

  // 默认图标
  return (
    <IconFontFill
      name="moxing-default"
      className="flex h-full w-full items-center justify-center"
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
