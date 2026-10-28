# 模型选择器

模型引用（租户 ID 或历史名称）用于读写配置；模型名称与厂商图标用于展示。
共享入口为 `src/components/models/model-select.tsx`，选项投影在同目录
`model-select-options.tsx`。新增模型选择器必须复用这两层，不能把引用当作 label。

## 状态与兼容性

- 已知模型：候选项、当前值均显示名称与 `ProviderIcon`。同厂商同名模型存在多个
  可用连接时，使用 API 投影提供的连接名区分；单连接不添加 `default`。
- 加载中、离线暂停：保留已知名称与图标，显示加载状态，不判定不可用。
- 列表失败：保留上次成功的身份信息，明确“暂无法确认可用状态”，提供重试。
  禁止把空的失败结果当作成功空列表。失败期间不能选择缓存中的模型。
- 列表成功后，当前引用缺失、禁用或不符合所需能力：按已知身份显示不可用并禁止选取。
  无法取得身份的纯数字引用显示“已保存的模型”，不猜测名称或厂商，也不展示数字。
- 名称或 `name@provider` 仅在唯一匹配时映射为显示值；有多个连接时不任选一个。
  渲染、加载与重试不写配置，只有用户选择才触发值变更，保存无关字段保留原始引用。
- PDF 的内置解析器不依赖模型接口，因此列表失败时仍可使用；动态模型选项继续关闭。
- Skill 两种协议使用各自 models 接口判断资格，租户列表仅补全显示身份，不能据此
  绕过 Skill 接口错误或推断可用。真实供应商连通性不由配置状态证明。

## 2026-10-28 调用方排查

| 入口                             | 实际消费链                                                                  |
| -------------------------------- | --------------------------------------------------------------------------- |
| 首页、MCP 对话、Explore、AI 工具 | `ChatModelSelector`；请求状态由页面或 `useModelSelectorRequest` 传入        |
| Studio 模型、知识检索设置        | `ChatModelSelector`、`RerankModelSelector`；保留连接标签                    |
| 默认模型设置                     | 七种能力字段均使用 `ModelSelect`，表单集中呈现列表错误与重试                |
| 知识库创建、设置、检索调试       | `EmbeddingModelSelector`、`EmbeddingModelFormField`、`RerankModelSelector`  |
| PDF、文档与 Agent 解析           | `LayoutRecognizeFormField`、`ParserSelectField`；选项转换保留图标与身份别名 |
| Agent 节点                       | `LLMSelectField`；聊天、嵌入、重排共用请求状态与选项                        |
| HTML 报表生成及试运行            | Designer 的 `ModelSelect` 适配器；弹层仍留在模态子树内，支持键盘搜索        |
| 记忆库创建及设置                 | 记忆选择器、嵌入选择器、`ReadOnlyModelField`；锁定字段同样解析引用          |
| Skill 检索配置（增强与核心协议） | `SkillModelSelect`；移除 `#ID` 拼接，失败与禁用明确区分                     |
| Search 页面设置                  | 同一聊天／重排组件；保留失效身份元数据，候选项仍按可用状态过滤              |

配置供应商、连接、模型类型等管理表单并不是“选择已配置模型”的控件；它们保留
各自的管理行为。模型管理操作菜单中的诊断 ID 也不属于模型名称展示。

回归覆盖位于 model picker、LLM query fallback、Studio model config、默认模型、
知识库设置、PDF parser 和 Search model hooks 的现有测试文件中，覆盖未知数字引用、
加载失败与重试、缓存失败、禁用、历史引用与原值保留、厂商图标、连接区分和精确重排引用。
