import { useState } from 'react'
import { Bot, Workflow } from 'lucide-react'

export function AgentAvatar({
  avatar,
  pipeline,
}: {
  avatar?: string
  pipeline: boolean
}) {
  const [failed, setFailed] = useState<string | undefined>()
  const source =
    avatar &&
    (avatar.startsWith('data:') || /^https?:\/\//i.test(avatar)
      ? avatar
      : `data:image/png;base64,${avatar}`)
  return (
    <span
      className="flex size-icon-2xl shrink-0 items-center justify-center overflow-hidden rounded-radius-lg border border-border-subtle bg-background-subtle text-text-secondary"
      aria-hidden="true"
    >
      {source && source !== failed ? (
        <img
          src={source}
          alt=""
          className="size-full object-cover"
          onError={() => setFailed(source)}
        />
      ) : pipeline ? (
        <Workflow className="size-icon-md" />
      ) : (
        <Bot className="size-icon-md" />
      )}
    </span>
  )
}
