export type TableColumnRole = 'indexing' | 'metadata' | 'both'
export type TableUploadConfig = {
  table_column_mode: 'auto' | 'manual'
  table_column_roles: Record<string, TableColumnRole>
}

export const isTableFile = (file: File) => /\.(csv|xlsx?)$/i.test(file.name)

/** Each request owns its file's roles; never merge columns from other files. */
export function tableUploadOptions(config?: TableUploadConfig) {
  return config ? { parser_config: config } : undefined
}
