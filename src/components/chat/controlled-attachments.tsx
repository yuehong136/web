import { useRef, type ComponentRef } from 'react'
import { Attachments, FileCard, type AttachmentsProps } from '@ant-design/x'
import { Upload } from 'antd'
import { Plus, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatBytes } from '@/lib/utils'

type ControlledAttachmentsProps = Omit<
  AttachmentsProps,
  | 'beforeUpload'
  | 'customRequest'
  | 'onChange'
  | 'onRemove'
  | 'disabled'
  | 'items'
> & {
  items: NonNullable<AttachmentsProps['items']>
  uploadLabel: string
  removeLabel: (name: string) => string
  retryLabel: (name: string) => string
  failureLabel: string
  onUpload: (file: File) => Promise<void>
  onRemove: (uid: string) => void
  onRetry?: (uid: string) => void
}

/** Requests and rows belong to the composer. Vendor upload/list state never owns them. */
export function ControlledAttachments({
  items,
  uploadLabel,
  removeLabel,
  retryLabel,
  failureLabel,
  onUpload,
  onRemove,
  onRetry,
  styles,
  maxCount,
  ...props
}: ControlledAttachmentsProps) {
  const picker = useRef<ComponentRef<typeof Attachments>>(null)
  const full = maxCount !== undefined && items.length >= maxCount
  return (
    <div style={styles?.root}>
      {items.length > 0 && (
        <div
          className="flex items-center gap-space-md overflow-x-auto"
          style={styles?.list}
        >
          {items.map((item) => (
            <div className="relative shrink-0" key={item.uid}>
              <FileCard
                {...item}
                onClick={
                  item.status === 'error' && onRetry
                    ? () => onRetry(item.uid)
                    : undefined
                }
                src={item.thumbUrl ?? item.src}
                byte={item.size}
                size="default"
                type={item.cardType}
                style={styles?.card}
                description={
                  item.description ??
                  (item.status === 'uploading'
                    ? `${item.percent ?? 0}%`
                    : item.status === 'error'
                      ? failureLabel
                      : formatBytes(item.size ?? 0))
                }
              />
              <div className="absolute top-0 right-0 flex">
                {item.status === 'error' && onRetry && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={retryLabel(item.name)}
                    onClick={() => onRetry(item.uid)}
                  >
                    <RotateCcw className="size-icon-sm" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={removeLabel(item.name)}
                  onClick={() => onRemove(item.uid)}
                >
                  <X className="size-icon-sm" />
                </Button>
              </div>
            </div>
          ))}
          {!full && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={uploadLabel}
              onClick={() => picker.current?.select({ multiple: true })}
            >
              <Plus className="size-icon-sm" />
            </Button>
          )}
        </div>
      )}
      <Attachments
        {...props}
        ref={picker}
        items={[]}
        disabled={full}
        maxCount={maxCount}
        styles={{
          ...styles,
          root: { padding: 0 },
          placeholder:
            items.length > 0 ? { display: 'none' } : styles?.placeholder,
        }}
        beforeUpload={(file, selection) => {
          if (
            maxCount !== undefined &&
            selection.indexOf(file) >= maxCount - items.length
          ) {
            return Upload.LIST_IGNORE
          }
          void onUpload(file)
          return Upload.LIST_IGNORE
        }}
      />
    </div>
  )
}
