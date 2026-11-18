import { Background, BackgroundVariant } from '@xyflow/react'

interface AgentBackgroundProps {
  className?: string
}

export function AgentBackground({ className }: AgentBackgroundProps) {
  return (
    <Background
      variant={BackgroundVariant.Dots}
      gap={20}
      size={1}
      color="var(--color-line-strong)"
      bgColor="var(--color-sunken)"
      className={className}
    />
  )
}
