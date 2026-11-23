import React, { useMemo, useState } from 'react'
import { Boxes } from 'lucide-react'
import { LLMFactory, IconMap } from '@/stores/model'
import { useIsDarkTheme } from '@/themes'
import { cn } from '@/lib/utils'
import {
  LOBE_ALIASES,
  LOBE_LOGOS,
  localProviderLogo,
  SPRITE_SUCCESSORS,
  type LogoFile,
} from './provider-logo-sources'

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
  LLMFactory.JiekouAI,
]

const normalizeProviderKey = (provider: string) =>
  provider.toLowerCase().replace(/[^a-z0-9]/g, '')

/** The @lobehub icon key for a provider name or one of its aliases. */
export function getLobeProviderIconKey(provider: string): string | null {
  const key = normalizeProviderKey(provider)
  if (!key) return null
  const icon = Object.hasOwn(LOBE_ALIASES, key) ? LOBE_ALIASES[key] : key
  return Object.hasOwn(LOBE_LOGOS, icon) ? icon : null
}

export type ProviderLogoSource =
  { kind: 'image'; url: string } | { kind: 'mask'; url: string }

const sourceOf = (logo: LogoFile): ProviderLogoSource => ({
  kind: logo.mono ? 'mask' : 'image',
  url: logo.url,
})

/** The file that draws an IconMap icon name: ours, else its @lobehub successor. */
function iconNameLogo(name: string): LogoFile | undefined {
  const local = localProviderLogo(name)
  if (local) return local
  const successor = SPRITE_SUCCESSORS[name.replace(/-(?:bright|dark)$/, '')]
  return successor ? LOBE_LOGOS[successor] : undefined
}

/**
 * Where a provider's logo comes from. Known providers keep our own SVG (or the
 * @lobehub mark that replaced their sprite symbol); other names try an exact
 * @lobehub alias before the loose substring match, so "Vertex AI" is not
 * drawn as xAI and "SiliconCloud" or "Kimi" get their brand marks.
 */
export function resolveProviderLogo(
  provider: string,
  isDark = false,
): ProviderLogoSource | null {
  const lobeKey = Object.hasOwn(IconMap, provider)
    ? null
    : getLobeProviderIconKey(provider)
  if (lobeKey) return sourceOf(LOBE_LOGOS[lobeKey])
  const name = getProviderIconName(provider, isDark)
  const logo = name ? iconNameLogo(name) : undefined
  return logo ? sourceOf(logo) : null
}

interface ProviderIconProps {
  provider: string
  className?: string
  size?: number
}

/** A single-color mark painted in the current text color. */
function ProviderLogoMask({
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
  const mask = `url("${url}") center / contain no-repeat`
  return (
    // Named like the image logos (alt text), without adding visible text.
    <span
      role="img"
      aria-label={provider}
      data-slot="provider-logo-mask"
      className={cn(className, 'relative inline-block shrink-0')}
      style={size === undefined ? undefined : { width: size, height: size }}
    >
      <span
        aria-hidden
        className="absolute inset-0 bg-current"
        style={{ mask, WebkitMask: mask }}
      />
    </span>
  )
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
        <Boxes aria-hidden className="size-full text-fg-muted" />
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
 * LLM 供应商图标组件：自有 SVG 优先，其余用 @lobehub/icons 的品牌标识
 * （见 resolveProviderLogo）；单色标识按文字颜色绘制，找不到时显示通用图标。
 */
export const ProviderIcon: React.FC<ProviderIconProps> = ({
  provider,
  className = 'w-6 h-6',
  size = 24,
}) => {
  const isDark = useIsDarkTheme()

  const source = useMemo(
    () => resolveProviderLogo(provider, isDark),
    [provider, isDark],
  )
  if (source?.kind === 'image')
    return (
      <ProviderLogoImage
        key={source.url}
        url={source.url}
        provider={provider}
        className={className}
        size={size}
      />
    )
  if (source?.kind === 'mask')
    return (
      <ProviderLogoMask
        url={source.url}
        provider={provider}
        className={className}
        size={size}
      />
    )

  // 默认图标（未找到匹配的厂商）
  return (
    <Boxes aria-hidden className={cn('shrink-0 text-fg-muted', className)} />
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
    return name ? Boolean(localProviderLogo(name)) : false
  })
}

/**
 * 获取已发布的厂商图片 URL（包括 SVG 和官方位图）
 * @deprecated 建议使用 ProviderIcon 组件代替
 */
export const getProviderIconPath = (
  provider: string,
  isDark: boolean = false,
): string | null => {
  const iconName = getProviderIconName(provider, isDark)
  if (!iconName) return null

  return iconNameLogo(iconName)?.url ?? null
}

/**
 * 判断给定厂商是否需要在暗黑模式下反色
 * @deprecated 单色标识按文字颜色绘制，不需要反色；保留仅为兼容性
 */
export const needsInvertFilter = (
  _provider: string,
  _isDark: boolean,
): boolean => {
  // 单色标识用遮罩按文字颜色绘制，不需要反色滤镜
  return false
}

/**
 * 获取厂商图标的 React 节点
 * 用于在非组件上下文中获取图标（如消息列表等）
 */
export const getProviderIcon = (modelName: string | null): React.ReactNode => {
  const source = modelName ? resolveProviderLogo(modelName, false) : null
  if (modelName && source?.kind === 'image')
    return (
      <ProviderLogoImage
        key={source.url}
        url={source.url}
        provider={modelName}
        className="h-full w-full"
      />
    )
  if (modelName && source?.kind === 'mask')
    return (
      <ProviderLogoMask
        url={source.url}
        provider={modelName}
        className="h-full w-full"
      />
    )

  // 默认图标：与 ProviderIcon 找不到厂商时一致
  return <Boxes aria-hidden className="h-full w-full text-fg-muted" />
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
