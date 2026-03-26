/**
 * 默认支持的文件类型
 * 使用 undefined 接受所有文件类型，后端会进行实际的文件类型验证
 */
export const DEFAULT_ACCEPTED_FILE_TYPES: Record<string, string[]> | undefined = undefined

export const DEFAULT_MAX_SIZE = 1024 * 1024 * 1024 // 1GB
export const DEFAULT_MAX_FILE_COUNT = 32
