import { MessageCircleMore } from 'lucide-react'
import { cn } from '@/lib/utils'
import dingtalkLogo from '@/assets/svg/chat-channel/dingtalk.svg'
import feishuLogo from '@/assets/svg/chat-channel/feishu.svg'

/**
 * Artwork for a provider, by name.
 *
 * The only part of a provider this client owns. The list of providers, their
 * names, descriptions and form fields all come from the server, precisely so
 * that adding one costs no frontend release — but a logo is a binary asset and
 * cannot. An unrecognised provider therefore falls back to a neutral glyph
 * instead of an empty box, on the same principle as an unknown field `kind`
 * rendering disabled: a provider the client has never heard of stays usable,
 * just plainer.
 */
const LOGOS: Record<string, string> = {
  dingtalk: dingtalkLogo,
  feishu: feishuLogo,
}

export const ProviderLogo = ({
  provider,
  displayName,
  className,
}: {
  provider: string
  displayName: string
  className?: string
}) => {
  const source = LOGOS[provider]

  if (!source) {
    return (
      <MessageCircleMore
        className={cn('text-text-secondary', className)}
        aria-hidden="true"
      />
    )
  }

  return (
    <img
      src={source}
      // Decorative: every caller renders the display name next to it, so an
      // announced alt would have a screen reader say the name twice.
      alt=""
      aria-hidden="true"
      title={displayName}
      className={cn('object-contain', className)}
    />
  )
}
