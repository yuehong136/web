import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/patterns'

interface PlaceholderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  bullets: string[]
}

export function PlaceholderDialog({
  open,
  onOpenChange,
  title,
  description,
  bullets,
}: PlaceholderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="px-space-lg pb-space-lg">
          <SectionCard padding="default">
            <div className="space-y-space-sm text-sm text-text-secondary">
              {bullets.map((bullet) => (
                <p key={bullet}>{bullet}</p>
              ))}
            </div>
          </SectionCard>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>知道了</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
