import { ProviderIcon } from '@/components/ui/provider-icon'
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export function ModelConfigurationHeader({
  provider,
  title,
  description,
}: {
  provider: string
  title: string
  description: string
}) {
  return (
    <DialogHeader>
      <div className="flex items-center gap-space-md">
        <div className="flex size-icon-2xl shrink-0 items-center justify-center rounded-radius-lg border border-border-subtle bg-background-subtle">
          <ProviderIcon
            provider={provider}
            className="size-icon-lg"
            size={28}
          />
        </div>
        <div className="min-w-0 flex-1">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </div>
      </div>
    </DialogHeader>
  )
}
