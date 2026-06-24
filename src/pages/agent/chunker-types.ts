export type ITitleChunkerRule = { levels: Array<{ expression: string }> }

export type ITokenChunkerForm = {
  outputs?: Record<string, any>
  delimiter_mode?: 'token_size' | 'delimiter' | 'one'
  chunk_token_size?: number
  overlapped_percent?: number
  delimiters?: Array<{ value: string }>
  children_delimiters?: Array<{ value: string }>
  enable_children?: boolean
  image_table_context_window?: number
}

export type ITitleChunkerForm = {
  outputs?: Record<string, any>
  method?: 'hierarchy' | 'group'
  hierarchyHierarchy?: string
  hierarchyGroup?: string
  include_heading_content?: boolean
  root_chunk_as_heading?: boolean
  hierarchyRules?: ITitleChunkerRule[]
  groupRules?: ITitleChunkerRule[]
}
