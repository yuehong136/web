# 表格上传与生成文件输出

知识库使用 `table` 解析器时，上传弹窗为每个 CSV、XLS 或 XLSX 文件提供列角色设置。
默认继承知识库配置；自动模式将列同时用于索引与元数据，手动模式按列选择
`indexing`、`metadata` 或 `both`。带覆盖的文件单独上传，避免同名列在批次之间串用角色；
失败文件保留配置并可重试，只有服务端确认的文档才启动解析。

CSV 列名按逗号分隔的第一条记录读取，保留引号内的逗号和列名中的点、空格。
Excel 预览读取第一个工作表首行，列角色作用于该文件中同名列；其他工作表独有列沿用
默认角色。空或重复列名、复杂合并表头无法准确预览时，使用继承或自动模式。
Excel 读取复用 `@js-preview/excel` 内置解析器，纯读取导出由
`patches/@js-preview+excel+1.7.14.patch` 提供，避免创建预览器及其 DOM/定时器。
升级该包时须重新核对纯读取导出和 CSV/XLS/XLSX 浏览器回归。

领域 API 将 `parser_config` 序列化为 multipart JSON。上传覆盖只提交
`table_column_mode` 与 `table_column_roles`；每个文档持久化自己的覆盖，知识库默认值保持原值。

DocGenerator 的 `doc_id`、`filename`、`mime_type` 为字符串输出，`size` 为数值输出。
这些定义贯穿默认值、表单 schema、DSL 保存/重开和下游变量选择器。
`download` 保留为附件描述，只有 Message 节点直接消费；其他标量可供普通下游节点引用。
文件下载继续通过受授权的运行时附件端点，与知识库原文档下载分开。
