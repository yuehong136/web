import React, { useMemo, useState } from 'react'
import { Boxes } from 'lucide-react'
import { LLMFactory, IconMap } from '@/stores/model'
import { useIsDarkTheme } from '@/themes'
import { cn } from '@/lib/utils'
import { IconFontFill } from './icon-font'
import openDataLoaderLogoUrl from '@/assets/images/opendataloader.webp?url'
// Brand marks for providers we have no logo of our own for; imported one by
// one so only these reach the bundle.
import alibabaCloudLogo from '@lobehub/icons-static-svg/icons/alibabacloud-color.svg?url'
import anyscaleLogo from '@lobehub/icons-static-svg/icons/anyscale-color.svg?url'
import awsLogo from '@lobehub/icons-static-svg/icons/aws.svg?url'
import baiduCloudLogo from '@lobehub/icons-static-svg/icons/baiducloud-color.svg?url'
import bailianLogo from '@lobehub/icons-static-svg/icons/bailian-color.svg?url'
import byteDanceLogo from '@lobehub/icons-static-svg/icons/bytedance-color.svg?url'
import cerebrasLogo from '@lobehub/icons-static-svg/icons/cerebras.svg?url'
import chatGlmLogo from '@lobehub/icons-static-svg/icons/chatglm-color.svg?url'
import claudeLogo from '@lobehub/icons-static-svg/icons/claude-color.svg?url'
import cloudflareLogo from '@lobehub/icons-static-svg/icons/cloudflare-color.svg?url'
import doubaoLogo from '@lobehub/icons-static-svg/icons/doubao-color.svg?url'
import falLogo from '@lobehub/icons-static-svg/icons/fal-color.svg?url'
import fireworksLogo from '@lobehub/icons-static-svg/icons/fireworks-color.svg?url'
import githubLogo from '@lobehub/icons-static-svg/icons/github.svg?url'
import googleLogo from '@lobehub/icons-static-svg/icons/google-color.svg?url'
import huaweiLogo from '@lobehub/icons-static-svg/icons/huawei-color.svg?url'
import hyperbolicLogo from '@lobehub/icons-static-svg/icons/hyperbolic-color.svg?url'
import iflytekLogo from '@lobehub/icons-static-svg/icons/iflytekcloud-color.svg?url'
import infinigenceLogo from '@lobehub/icons-static-svg/icons/infinigence-color.svg?url'
import kimiLogo from '@lobehub/icons-static-svg/icons/kimi.svg?url'
import metaLogo from '@lobehub/icons-static-svg/icons/meta.svg?url'
import microsoftLogo from '@lobehub/icons-static-svg/icons/microsoft-color.svg?url'
import qwenLogo from '@lobehub/icons-static-svg/icons/qwen-color.svg?url'
import sambaNovaLogo from '@lobehub/icons-static-svg/icons/sambanova-color.svg?url'
import senseNovaLogo from '@lobehub/icons-static-svg/icons/sensenova-color.svg?url'
import siliconCloudLogo from '@lobehub/icons-static-svg/icons/siliconcloud-color.svg?url'
import tencentLogo from '@lobehub/icons-static-svg/icons/tencent-color.svg?url'
import vertexAiLogo from '@lobehub/icons-static-svg/icons/vertexai-color.svg?url'
import zhipuLogo from '@lobehub/icons-static-svg/icons/zhipu-color.svg?url'

// Let Vite publish SVG URLs; source-directory paths do not exist in production.
const providerLogoUrls = import.meta.glob<string>(
  '/src/assets/svg/llm/{local-ai,gemini,stepfun,wenxin,yi,youdao,baai,nomic-ai,sentence-transformers,aimlapi,astraflow,fastembed,funasr,futurmix,greenpt,grok,huaweicloud,mws,new-api,orcarouter,qiniu,somark,tokenhub,xiaomi,mineru-bright,mineru-dark,paddleocr,n1n,jiekouai-bright,jiekouai-dark,avian,ragcon,perplexity-bright,perplexity-dark}.svg',
  { eager: true, query: '?url', import: 'default' },
)

const providerLogoUrl = (iconName: string) =>
  iconName === 'opendataloader'
    ? openDataLoaderLogoUrl
    : providerLogoUrls[`/src/assets/svg/llm/${iconName}.svg`]

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

/**
 * @lobehub/icons marks by icon key. Color marks render as images; single-color
 * marks render as masks so they follow the text color like the sprite logos.
 */
const LOBE_LOGOS: Record<string, { url: string; mono?: true }> = {
  alibabacloud: { url: alibabaCloudLogo },
  anyscale: { url: anyscaleLogo },
  aws: { url: awsLogo, mono: true },
  baiducloud: { url: baiduCloudLogo },
  bailian: { url: bailianLogo },
  bytedance: { url: byteDanceLogo },
  cerebras: { url: cerebrasLogo, mono: true },
  chatglm: { url: chatGlmLogo },
  claude: { url: claudeLogo },
  cloudflare: { url: cloudflareLogo },
  doubao: { url: doubaoLogo },
  fal: { url: falLogo },
  fireworks: { url: fireworksLogo },
  github: { url: githubLogo, mono: true },
  google: { url: googleLogo },
  huawei: { url: huaweiLogo },
  hyperbolic: { url: hyperbolicLogo },
  iflytekcloud: { url: iflytekLogo },
  infinigence: { url: infinigenceLogo },
  kimi: { url: kimiLogo, mono: true },
  meta: { url: metaLogo, mono: true },
  microsoft: { url: microsoftLogo },
  qwen: { url: qwenLogo },
  sambanova: { url: sambaNovaLogo },
  sensenova: { url: senseNovaLogo },
  siliconcloud: { url: siliconCloudLogo },
  tencent: { url: tencentLogo },
  vertexai: { url: vertexAiLogo },
  zhipu: { url: zhipuLogo },
}

/**
 * Other spellings of a provider (lowercase letters and digits only) and the
 * @lobehub icon key that draws it. Names matching a key directly need no entry.
 */
const LOBE_ALIASES: Record<string, string> = {
  alibaba: 'alibabacloud',
  aliyun: 'alibabacloud',
  amazon: 'aws',
  baidu: 'baiducloud',
  bigmodel: 'zhipu',
  dashscope: 'bailian',
  ernie: 'baiducloud',
  fireworksai: 'fireworks',
  falai: 'fal',
  glm: 'chatglm',
  githubmodels: 'github',
  googleai: 'google',
  googleaistudio: 'google',
  iflytek: 'iflytekcloud',
  llama: 'meta',
  metaai: 'meta',
  moonshot: 'kimi',
  moonshotai: 'kimi',
  qianfan: 'baiducloud',
  qianwen: 'qwen',
  sensetime: 'sensenova',
  siliconflow: 'siliconcloud',
  tongyi: 'qwen',
  vertex: 'vertexai',
  googlevertexai: 'vertexai',
  volcark: 'doubao',
  workersai: 'cloudflare',
  xfyun: 'iflytekcloud',
  zhipuai: 'zhipu',
}

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
  | { kind: 'image'; url: string }
  | { kind: 'mask'; url: string }
  | { kind: 'sprite'; name: string }

/**
 * Where a provider's logo comes from. Known providers keep our own SVG or
 * sprite; other names try an exact @lobehub alias before the loose substring
 * match, so "Vertex AI" is not drawn as xAI and "SiliconCloud" or "Kimi" get
 * their brand marks.
 */
export function resolveProviderLogo(
  provider: string,
  isDark = false,
): ProviderLogoSource | null {
  const lobeKey = Object.hasOwn(IconMap, provider)
    ? null
    : getLobeProviderIconKey(provider)
  if (lobeKey) {
    const logo = LOBE_LOGOS[lobeKey]
    return { kind: logo.mono ? 'mask' : 'image', url: logo.url }
  }
  const name = getProviderIconName(provider, isDark)
  if (!name) return null
  const url = providerLogoUrl(name)
  return url ? { kind: 'image', url } : { kind: 'sprite', name }
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
    <span
      data-slot="provider-logo-mask"
      className={cn(className, 'relative inline-block shrink-0')}
      style={size === undefined ? undefined : { width: size, height: size }}
    >
      <span
        aria-hidden
        className="absolute inset-0 bg-current"
        style={{ mask, WebkitMask: mask }}
      />
      {/* Named like the image logos (alt text) for screen readers. */}
      <span className="sr-only">{provider}</span>
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
 * 优先使用已注册的 SVG 资源，其他已知厂商使用 iconfont；
 * 都没有时用 @lobehub/icons 的品牌标识（见 resolveProviderLogo）。
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

  // 使用 iconfont
  if (source?.kind === 'sprite') {
    return (
      <IconFontFill
        name={source.name}
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
    return name ? !!providerLogoUrls[`/src/assets/svg/llm/${name}.svg`] : false
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

  return providerLogoUrl(iconName) ?? null
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

  const source = resolveProviderLogo(modelName, false)
  if (source?.kind === 'image')
    return (
      <ProviderLogoImage
        key={source.url}
        url={source.url}
        provider={modelName}
        className="h-full w-full"
      />
    )
  if (source?.kind === 'mask')
    return (
      <ProviderLogoMask
        url={source.url}
        provider={modelName}
        className="h-full w-full"
      />
    )
  if (source?.kind === 'sprite')
    return (
      <IconFontFill
        name={source.name}
        className="flex h-full w-full items-center justify-center"
      />
    )

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
