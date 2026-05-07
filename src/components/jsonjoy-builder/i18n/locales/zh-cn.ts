import { en } from './en'
import type { Translation } from '../translation-keys'

export const zhCN: Translation = {
  ...en,
  collapse: '折叠',
  expand: '展开',

  fieldDescriptionPlaceholder: '描述该字段的用途',
  fieldDelete: '删除字段',
  fieldDescription: '描述',
  fieldDescriptionTooltip: '补充该字段表示的业务含义',
  fieldNameLabel: '字段名',
  fieldNamePlaceholder: '例如 firstName、age、isActive',
  fieldNameTooltip: '建议使用 camelCase，例如 firstName',
  fieldRequiredLabel: '必填字段',
  fieldType: '字段类型',
  fieldAddNewButton: '添加字段',
  fieldAddNewBadge: 'Schema Builder',
  fieldAddNewCancel: '取消',
  fieldAddNewConfirm: '添加字段',
  fieldAddNewDescription: '为 JSON Schema 创建一个新字段',
  fieldAddNewLabel: '添加字段',
  fieldSaveConfirm: '保存字段',
  fieldNameDuplicate: '已存在同名字段。',
  fieldNameInvalid: '字段名需以字母或下划线开头，只能包含字母、数字、下划线或美元符号。',
  fieldNameRequired: '请输入字段名。',

  fieldTypeTextLabel: '文本',
  fieldTypeNumberLabel: '数字',
  fieldTypeBooleanLabel: '是/否',
  fieldTypeObjectLabel: '对象',
  fieldTypeArrayLabel: '列表',

  propertyRequired: '必填',
  propertyOptional: '可选',
  propertyDelete: '删除字段',

  schemaEditorTitle: 'JSON Schema 编辑器',
  schemaEditorEditModeVisual: '可视化',
  schemaEditorEditModeJson: 'JSON',

  arrayItemTypeLabel: '元素类型',

  schemaTypeArray: '列表',
  schemaTypeBoolean: '是/否',
  schemaTypeNumber: '数字',
  schemaTypeObject: '对象',
  schemaTypeString: '文本',
  schemaTypeNull: '空',

  visualizerDownloadTitle: '下载 Schema',
  visualizerDownloadFileName: 'schema.json',
  visualizerSource: 'JSON Schema 源码',
  visualizerLoadTimeoutTitle: 'Monaco 编辑器仍在加载',
  visualizerLoadTimeoutDescription: '请检查当前部署是否可访问 /vs/loader.js。',

  visualEditorNoFieldsHint1: '暂无字段',
  visualEditorNoFieldsHint2: '添加第一个字段后即可生成结构化输出 Schema',
  visualEditorFieldsLabel: '字段',
  visualEditorRequiredLabel: '必填',
}
