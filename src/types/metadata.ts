/** 元数据过滤条件中的单个条件。 */
export interface MetadataFilterCondition {
  name: string
  comparison_operator: string
  value?: string | number | boolean
}

/** 供聊天和检索 API 使用的元数据过滤条件。 */
export interface MetadataCondition {
  logic?: 'and' | 'or'
  conditions?: MetadataFilterCondition[]
}

export type MetadataValueType = 'string' | 'list' | 'time' | 'number'
export type MetadataDefinition =
  | MetadataFieldDefinition[]
  | Record<string, unknown>

/** 知识库 metadata 模板中的字段定义。 */
export interface MetadataFieldDefinition {
  key: string
  description?: string
  type?: MetadataValueType
  enum?: Array<string | number>
  examples?: Array<string | number>
  restrict_values?: boolean
  [key: string]: unknown
  restrictDefinedValues?: boolean
}

export interface MetadataSummaryItem {
  field: string
  type?: string
  values: Array<[string | number, number]>
}

export interface MetadataSummaryResponse {
  summary: Record<
    string,
    MetadataSummaryItem | Array<[string | number, number]>
  >
  total_docs?: number
}

export interface MetadataUpdateOperation {
  key: string
  match: string
  value: string
}

export interface MetadataDeleteOperation {
  key: string
  value?: string
}

export interface MetadataBatchRequest {
  dataset_id: string
  selector?: {
    document_ids?: string[]
    metadata_condition?: MetadataCondition
  }
  updates?: MetadataUpdateOperation[]
  deletes?: MetadataDeleteOperation[]
}

export interface KBMetadataSettingsRequest {
  kb_id: string
  metadata: MetadataDefinition
  enable_metadata?: boolean
  built_in_metadata?: MetadataFieldDefinition[]
}

export interface DocumentMetadataSettingsRequest {
  kb_id: string
  doc_id: string
  metadata: MetadataDefinition
}

export interface DocumentMetadataUpdateRequest {
  doc_id: string
  meta: string
}

export interface MetadataTableData {
  valueType?: MetadataValueType
  definition?: MetadataFieldDefinition
  field: string
  description: string
  restrictDefinedValues?: boolean
  values: string[]
}

export enum MetadataManageType {
  MANAGE = 1,
  UPDATE_SINGLE = 2,
  SETTING = 3,
  SINGLE_FILE_SETTING = 4,
}
