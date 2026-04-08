import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileUploader, type UploadFile } from '@/components/ui/file-uploader'
import { FileJson } from 'lucide-react'

interface ImportAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (payload: { title: string; file: File }) => Promise<void> | void
}

export function ImportAgentDialog({
  open,
  onOpenChange,
  onImport,
}: ImportAgentDialogProps) {
  const [title, setTitle] = useState('')
  const [files, setFiles] = useState<UploadFile[]>([])
  const [submitting, setSubmitting] = useState(false)

  const selectedFile = useMemo(() => files[0], [files])

  const handleSubmit = async () => {
    if (!selectedFile) {
      return
    }

    const fallbackTitle = selectedFile.name.replace(/\.json$/i, '')
    setSubmitting(true)
    try {
      await onImport({
        title: title.trim() || fallbackTitle,
        file: selectedFile,
      })
      setFiles([])
      setTitle('')
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="mb-space-sm flex h-11 w-11 items-center justify-center rounded-radius-xl bg-state-warning-subtle text-state-warning">
            <FileJson className="h-5 w-5" />
          </div>
          <DialogTitle>导入 JSON</DialogTitle>
          <DialogDescription>
            支持导入历史 Agent / Pipeline DSL，第一阶段会自动归类并落到新的管理骨架里。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-space-lg px-space-lg pb-space-lg">
          <div className="space-y-space-sm">
            <label htmlFor="import-title" className="text-sm font-medium text-text-primary">
              导入名称
            </label>
            <Input
              id="import-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="留空时默认使用文件名"
            />
          </div>

          <FileUploader
            value={files}
            onValueChange={setFiles}
            multiple={false}
            maxFileCount={1}
            enableFolderUpload={false}
            title="拖拽 JSON 文件到这里"
            description="仅接受一个 .json 文件。"
            accept={{
              'application/json': ['.json'],
            }}
            compact
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedFile || submitting}>
            {submitting ? '导入中...' : '开始导入'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
