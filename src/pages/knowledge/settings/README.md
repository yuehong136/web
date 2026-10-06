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

## 名称校验

创建、快速编辑与设置保存复用 `src/lib/knowledge/name.ts`：去除首尾空白后非空，
最多 128 个 UTF-8 字节。支持中文、空格、数字开头及标点，清除历史 100 字符与
字母开头规则。字节预算与 MultiRAG 创建服务一致；重复名称与具体存储引擎约束
仍由服务端决定，Web 不预设额外字符规则。

## 其他契约边界

自动元数据字段仍为 `parser_config.metadata`；内置字段为 `built_in_metadata`。
分块保存必须保留 metadata，省略的内置配置由后端合并保留。
文档级配置继续使用文档自己的 PATCH 与草稿生命周期。

Pipeline 选择复用文档级目录查询，按知识库 `tenant_id` 和 `dataflow_canvas` 筛选，
支持搜索、分页、失败重试及已选项回查。不可用的已有选择保留并提示，不自动替换。
Pipeline 模式只校验 `pipeline_id`，不要求填写内置解析器；保存通过 PUT 的
`ext.pipeline_id` 传递（当前 MultiRAG 更新模型不接收顶层 `pipeline_id`）。
切回内置时明确发送空 `ext.pipeline_id` 并提交 `chunk_method`，清除旧关联。
只改名称/描述的快速编辑省略 Pipeline 字段，保留现有关联。

当前详情页没有数据集总 `size` 的展示消费者。关联连接器通过
`useDataSourceByKb` 的独立领域查询获取，不依赖详情 `connectors`；
分块设置保存不发送 `connectors`，避免覆盖关联。

## 回归与运行验收

表单值回归覆盖嵌套/扁平读取、明确关闭、重叠比例校验及 metadata 保留。
页面回归使用真实 Query hook、API 字段映射、表单 resolver 和分块控件，
覆盖编辑、保存请求、重新挂载及失败后重试。新行为验收还须在隔离环境实际保存，
检查业务码、独立 GET 与数据库读回，再完整重载页面确认回显；合同测试不能替代该验收。
