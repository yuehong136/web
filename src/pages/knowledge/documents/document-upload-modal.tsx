/**
 * 文档上传模态框组件
 */

import React, { useState, useCallback } from 'react'
import {
  Modal,
  Button,
  FileUploader,
  Switch,
  type UploadFile,
  type FileRejection,
} from '@/components/ui'
import { knowledgeAPI } from '@/api/knowledge'
import { toast } from '@/lib/toast'

interface DocumentUploadModalProps {
  open: boolean
  onClose: () => void
  kbId: string
  onSuccess: () => void
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  open,
  onClose,
  kbId,
  onSuccess,
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [parseOnUpload, setParseOnUpload] = useState(true)

  // 文件上传变化处理
  const handleUploadFilesChange = useCallback((files: UploadFile[]) => {
    setUploadFiles(files)
  }, [])

  // 文件被拒绝处理
  const handleFilesRejected = useCallback((rejectedFiles: FileRejection[]) => {
    rejectedFiles.forEach(({ file, errors }) => {
      const errorMessages = errors.map((e) => {
        if (e.code === 'file-too-large')
          return `文件 "${file.name}" 超过大小限制`
        if (e.code === 'file-invalid-type')
          return `文件 "${file.name}" 类型不支持`
        if (e.code === 'too-many-files') return `文件数量超过限制`
        return e.message
      })
      toast.error(errorMessages.join('; '))
    })
  }, [])

  // 执行上传
  const handleUpload = async () => {
    if (!kbId || uploadFiles.length === 0) return

    // 获取待上传的文件（排除已成功的）
    const filesToUpload = uploadFiles.filter((f) => f.status !== 'success')
    if (filesToUpload.length === 0) {
      toast.info('所有文件已上传完成')
      handleClose()
      return
    }

    try {
      setUploading(true)

      // 更新所有待上传文件为上传中状态
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.status !== 'success'
            ? { ...f, status: 'uploading' as const, progress: 0 }
            : f
        )
      )

      // 使用API客户端上传所有文件
      const uploadedDocs = await knowledgeAPI.document.upload(
        kbId,
        filesToUpload
      )

      if (uploadedDocs && uploadedDocs.length > 0) {
        // 更新文件状态为成功
        setUploadFiles((prev) =>
          prev.map((f) => ({
            ...f,
            status: 'success' as const,
            progress: 100,
          }))
        )

        toast.success(`成功上传 ${uploadedDocs.length} 个文档`)

        // 如果开启了"创建时解析"，自动触发解析
        if (parseOnUpload) {
          try {
            const docIds = uploadedDocs.map((doc) => doc.id)
            await knowledgeAPI.document.run(docIds, 1, false)
            toast.success(`已开始解析 ${docIds.length} 个文档`)
          } catch (parseError) {
            console.error('自动解析失败:', parseError)
            toast.error('文档上传成功，但自动解析失败，请手动触发解析')
          }
        }

        // 稍等片刻让用户看到成功状态，然后关闭
        setTimeout(() => {
          handleClose()
          onSuccess()
        }, 800)
      } else {
        // 更新文件状态为失败
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.status === 'uploading'
              ? { ...f, status: 'error' as const, error: '服务器响应异常' }
              : f
          )
        )
        toast.error('上传失败：服务器响应异常')
      }
    } catch (error) {
      console.error('文档上传失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'

      // 更新文件状态为失败
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading'
            ? { ...f, status: 'error' as const, error: errorMessage }
            : f
        )
      )

      toast.error(`文档上传失败: ${errorMessage}`)
    } finally {
      setUploading(false)
    }
  }

  // 重试上传失败的文件
  const handleRetryUpload = useCallback(
    async (file: UploadFile, index: number) => {
      if (!kbId) return

      // 更新单个文件状态为上传中
      setUploadFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: 'uploading' as const,
                progress: 0,
                error: undefined,
              }
            : f
        )
      )

      try {
        const uploadedDocs = await knowledgeAPI.document.upload(kbId, [file])

        if (uploadedDocs && uploadedDocs.length > 0) {
          setUploadFiles((prev) =>
            prev.map((f, i) =>
              i === index
                ? { ...f, status: 'success' as const, progress: 100 }
                : f
            )
          )
          toast.success(`文件 "${file.name}" 上传成功`)
        } else {
          setUploadFiles((prev) =>
            prev.map((f, i) =>
              i === index
                ? { ...f, status: 'error' as const, error: '上传失败' }
                : f
            )
          )
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '上传失败'
        setUploadFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? { ...f, status: 'error' as const, error: errorMessage }
              : f
          )
        )
      }
    },
    [kbId]
  )

  // 关闭模态框
  const handleClose = () => {
    if (!uploading) {
      setUploadFiles([])
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="上传文档" size="lg">
      <div className="space-y-6">
        {/* 使用增强的 FileUploader 组件 */}
        <FileUploader
          value={uploadFiles}
          onValueChange={handleUploadFilesChange}
          onFilesRejected={handleFilesRejected}
          onRetry={handleRetryUpload}
          maxSize={1024 * 1024 * 1024} // 1GB
          maxFileCount={32}
          multiple={true}
          showProgress={true}
          disabled={uploading}
          dropzoneHeight="min-h-[180px]"
          listMaxHeight="max-h-[240px]"
          description={
            <>
              支持 PDF、Word、Excel、PPT、Markdown、代码文件、图片、音视频等多种格式。
              单次上传文件总大小上限为{' '}
              <span
                className="font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                1GB
              </span>
              ， 单次批量上传文件数不超过{' '}
              <span
                className="font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                32
              </span>{' '}
              个
            </>
          }
        />

        {/* 创建时解析开关 */}
        <div
          className="flex items-center justify-between py-3 px-4 rounded-lg"
          style={{ backgroundColor: 'var(--color-surface-secondary)' }}
        >
          <div className="flex flex-col">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              创建时解析
            </span>
            <span
              className="text-xs"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              上传成功后自动开始解析文档
            </span>
          </div>
          <Switch
            checked={parseOnUpload}
            onCheckedChange={setParseOnUpload}
            disabled={uploading}
          />
        </div>

        {/* 操作按钮 */}
        <div
          className="flex justify-end space-x-3 pt-4"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            取消
          </Button>
          <Button
            onClick={handleUpload}
            loading={uploading}
            disabled={
              uploadFiles.length === 0 ||
              uploadFiles.every((f) => f.status === 'success')
            }
          >
            {uploading
              ? '上传中...'
              : uploadFiles.some((f) => f.status === 'success')
                ? `上传剩余 ${uploadFiles.filter((f) => f.status !== 'success').length} 个文件`
                : `上传 ${uploadFiles.length} 个文件`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
