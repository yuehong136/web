# 元数据模板编辑

`src/lib/metadata-config.ts` 负责 API 模板与表格字段间转换。保存 `key/type/enum`，
重载支持字段列表和完整 JSON Schema；历史 `name/examples/restrict_values` 仍可编辑。
不受限制的示例保存为 examples，避免再次变成 enum 约束。

知识库模板通过 `knowledgeMetadataAPI.updateKBSettings` 写新 `metadata` 信封。
编辑器只保存模板，自动抽取开关由知识库设置页管理，模板保存不隐式开启开关。
`initialConfig` 保留原 Schema，使未知扩展、属性约束及 required 不因表格转换丢失。
文档模板使用专用 PUT；通用 document PATCH 仍由文档设置流程管理。

新增字段默认为 string；值类型可选 Text、List、Time、Number，发送小写类型。
Number 示例在编辑时校验，完整 Schema 中转换为数值枚举，字段列表保持字符串输入。
部署时先升级支持双信封的后端，再升级 Web。旧后端若只接受 enabled/fields，不能
直接部署此消费者。后端合同以 MultiRAG 的 `docs/references/metadata-configuration.md` 为准。

回归覆盖：`src/lib/__tests__/metadata-config.test.ts`、API metadata-config tests，
以及 documents 的 document-metadata-settings DOM tests。
