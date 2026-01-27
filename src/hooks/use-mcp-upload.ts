import { useState, useCallback, useRef } from 'react'
import type { UploadFile, UploadedFileInfo } from '@/config/chat'

/**
 * MCP 实验场文件上传 Hook
 * 
 * 使用 /v1/document/upload_info 接口上传文件
 * 不需要 conversation_id，适用于 MCP 场景
 * 
 * 功能：
 * - 文件上传状态管理（uploading, done, error）
 * - 上传进度实时更新
 * - 支持取消上传
 * - 支持多文件管理
 * - 获取已上传文件的 ID 列表（用于 enhanced_chat_sse 的 files 参数）
 */
export function useMcpUpload() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  
  // 存储每个文件的 AbortController，用于取消上传
  const abortControllers = useRef<Map<string, AbortController>>(new Map())
  
  /**
   * 生成唯一文件 ID
   */
  const generateUid = useCallback(() => {
    return `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }, [])
  
  /**
   * 上传单个文件（使用 /v1/document/upload_info）
   */
  const upload = useCallback(async (file: File): Promise<UploadedFileInfo | null> => {
    const controller = new AbortController()
    const uid = generateUid()
    abortControllers.current.set(uid, controller)
    
    // 创建图片预览 URL
    const thumbUrl = file.type.startsWith('image/') 
      ? URL.createObjectURL(file) 
      : undefined
    
    // 添加到文件列表（uploading 状态）
    const newFile: UploadFile = {
      uid,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      percent: 0,
      originFileObj: file,
      thumbUrl,
    }
    
    setFiles(prev => [...prev, newFile])
    setUploading(true)
    
    try {
      const result = await uploadFileInfo(
        file,
        (percent) => {
          // 更新上传进度
          setFiles(prev => prev.map(f => 
            f.uid === uid ? { ...f, percent } : f
          ))
        },
        controller.signal
      )
      
      // 更新为 done 状态
      setFiles(prev => prev.map(f => 
        f.uid === uid ? { ...f, status: 'done' as const, percent: 100, response: result } : f
      ))
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      
      // 如果是取消操作，直接移除文件
      if (errorMessage === 'Upload cancelled') {
        setFiles(prev => prev.filter(f => f.uid !== uid))
        return null
      }
      
      // 更新为 error 状态
      setFiles(prev => prev.map(f => 
        f.uid === uid ? { ...f, status: 'error' as const, error: error as Error } : f
      ))
      
      return null
    } finally {
      abortControllers.current.delete(uid)
      
      // 检查是否还有其他文件在上传
      setFiles(prev => {
        const stillUploading = prev.some(f => f.status === 'uploading')
        if (!stillUploading) {
          setUploading(false)
        }
        return prev
      })
    }
  }, [generateUid])
  
  /**
   * 批量上传文件
   */
  const uploadMultiple = useCallback(async (fileList: File[]): Promise<(UploadedFileInfo | null)[]> => {
    const results = await Promise.all(fileList.map(file => upload(file)))
    return results
  }, [upload])
  
  /**
   * 取消指定文件的上传
   */
  const cancel = useCallback((uid: string) => {
    const controller = abortControllers.current.get(uid)
    if (controller) {
      controller.abort()
      abortControllers.current.delete(uid)
    }
    setFiles(prev => prev.filter(f => f.uid !== uid))
  }, [])
  
  /**
   * 取消所有上传
   */
  const cancelAll = useCallback(() => {
    abortControllers.current.forEach(controller => controller.abort())
    abortControllers.current.clear()
    setFiles(prev => prev.filter(f => f.status !== 'uploading'))
  }, [])
  
  /**
   * 移除指定文件（已上传完成的文件）
   */
  const removeFile = useCallback((uid: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.uid === uid)
      // 如果有预览 URL，释放它
      if (file?.thumbUrl) {
        URL.revokeObjectURL(file.thumbUrl)
      }
      return prev.filter(f => f.uid !== uid)
    })
  }, [])
  
  /**
   * 清空所有文件
   */
  const clearFiles = useCallback(() => {
    // 取消所有正在上传的文件
    cancelAll()
    // 释放所有预览 URL
    files.forEach(file => {
      if (file.thumbUrl) {
        URL.revokeObjectURL(file.thumbUrl)
      }
    })
    setFiles([])
  }, [cancelAll, files])
  
  /**
   * 获取已上传成功的文件 ID 列表
   * 用于 enhanced_chat_sse 的 files 参数
   */
  const getFileIds = useCallback((): string[] => {
    return files
      .filter(f => f.status === 'done' && f.response?.id)
      .map(f => f.response!.id)
  }, [files])
  
  /**
   * 检查是否有上传失败的文件
   */
  const hasError = files.some(f => f.status === 'error')
  
  /**
   * 检查是否所有文件都上传完成
   */
  const allDone = files.length > 0 && files.every(f => f.status === 'done')
  
  /**
   * 获取上传成功的文件数量
   */
  const doneCount = files.filter(f => f.status === 'done').length
  
  /**
   * 重试上传失败的文件
   */
  const retry = useCallback(async (uid: string) => {
    const file = files.find(f => f.uid === uid)
    if (!file || file.status !== 'error' || !file.originFileObj) {
      return null
    }
    
    // 先移除失败的文件
    removeFile(uid)
    
    // 重新上传
    return upload(file.originFileObj)
  }, [files, removeFile, upload])
  
  return {
    /** 文件列表 */
    files,
    /** 是否正在上传 */
    uploading,
    /** 是否有上传失败的文件 */
    hasError,
    /** 是否所有文件都上传完成 */
    allDone,
    /** 上传成功的文件数量 */
    doneCount,
    /** 上传单个文件 */
    upload,
    /** 批量上传文件 */
    uploadMultiple,
    /** 取消指定文件的上传 */
    cancel,
    /** 取消所有上传 */
    cancelAll,
    /** 移除指定文件 */
    removeFile,
    /** 清空所有文件 */
    clearFiles,
    /** 获取已上传文件的 ID 列表（用于 enhanced_chat_sse） */
    getFileIds,
    /** 重试上传失败的文件 */
    retry,
    /** 直接设置文件列表（用于 Attachments 组件） */
    setFiles,
  }
}

/**
 * 使用 /v1/document/upload_info 上传文件
 * 不需要 conversation_id
 */
async function uploadFileInfo(
  file: File,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<UploadedFileInfo> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    xhr.open('POST', `${baseURL}/v1/document/upload_info`)
    
    // 设置认证头
    const token = localStorage.getItem('auth_token')
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }
    
    // 上传进度回调
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100)
        onProgress?.(progress)
      }
    }
    
    // 上传完成处理
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          if (response.code === 0 || response.retcode === 0) {
            resolve(response.data)
          } else {
            reject(new Error(response.message || response.retmsg || 'Upload failed'))
          }
        } catch (e) {
          reject(new Error('Invalid response format'))
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
      }
    }
    
    // 错误处理
    xhr.onerror = () => reject(new Error('Network error'))
    xhr.ontimeout = () => reject(new Error('Upload timeout'))
    
    // 支持取消上传
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort()
        reject(new Error('Upload cancelled'))
      })
    }
    
    // 构建 FormData
    const formData = new FormData()
    formData.append('file', file)
    
    // 发送请求
    xhr.send(formData)
  })
}

export type UseMcpUploadReturn = ReturnType<typeof useMcpUpload>
