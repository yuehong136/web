# 知识库分块设置读写契约

知识库设置页通过 `GET /api/v1/datasets/{id}` 读取详情，通过
`PUT /api/v1/datasets/{id}` 保存。页面消费 `KnowledgeBase` 领域模型，
传输字段由 `src/api/knowledge.ts` 统一映射；组件不直接依赖 Dataset DTO。

| 详情字段          | 页面字段    | 用途             |
| ----------------- | ----------- | ---------------- |
| `document_count`  | `doc_num`   | 文档统计         |
| `chunk_count`     | `chunk_num` | 分块统计         |
| `embedding_model` | `embd_id`   | 嵌入模型选择     |
| `chunk_method`    | `parser_id` | 分块配置组件选择 |

分块配置的表单校验与映射由 `src/types/knowledge-form.ts` 和
`src/pages/knowledge/settings/knowledge-settings-form-values.ts` 管理。
通用分块的文本块大小、父子分块开关、子分隔符及重叠比例均须经过校验后进入请求体。
重叠比例存储为 0–0.3 的小数，界面显示为 0–30%。

## 父子分块

- 详情含 `parser_config.parent_child` 时，以其中的 `use_parent_child` 和
  `children_delimiter` 初始化已有的扁平表单控件；空对象表示关闭。
- 只有扁平 `enable_children` / `children_delimiter` 的旧配置仍可读取。
- 保存时生成与表单一致的嵌套 `parent_child`，避免嵌套旧值覆盖本次编辑。
  后端负责同步执行层扁平字段；关闭后返回空 `parent_child`、
  `enable_children=false`、`children_delimiter=""`，完整重载后仍保持关闭。
- 配置默认值保留明确的 `false`，包括 RAPTOR、GraphRAG 和自动元数据开关。

## 其他契约边界

自动元数据字段仍为 `parser_config.metadata`；内置字段为 `built_in_metadata`。
分块保存必须保留 metadata，省略的内置配置由后端合并保留。
文档级配置继续使用文档自己的 PATCH 与草稿生命周期。

Pipeline 类型和访问权限沿用现有页面与后端约束。知识库 Pipeline 选择器仍未接入
实际 Pipeline 列表/保存接口；本契约不扩大该能力。

当前详情页没有数据集总 `size` 的展示消费者。关联连接器通过
`useDataSourceByKb` 的独立领域查询获取，不依赖详情 `connectors`；
分块设置保存不发送 `connectors`，避免覆盖关联。

## 回归与运行验收

表单值回归覆盖嵌套/扁平读取、明确关闭、重叠比例校验及 metadata 保留。
页面回归使用真实 Query hook、API 字段映射、表单 resolver 和分块控件，
覆盖编辑、保存请求、重新挂载及失败后重试。新行为验收还须在隔离环境实际保存，
检查业务码、独立 GET 与数据库读回，再完整重载页面确认回显；合同测试不能替代该验收。
