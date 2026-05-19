import type { ReactNode } from 'react'
import { FileText } from 'lucide-react'

interface ChunkListStateProps {
  label: string
  spinning?: boolean
  children?: ReactNode
}

export const ChunkListState = ({
  label,
  spinning,
  children,
}: ChunkListStateProps) => (
  <div className="p-8 text-center text-text-tertiary">
    {spinning ? (
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-text-accent" />
    ) : (
      <FileText className="mx-auto mb-4 h-12 w-12 text-text-muted" />
    )}
    <p className={children ? 'mb-4' : undefined}>{label}</p>
    {children}
  </div>
)
