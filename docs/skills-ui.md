# Skills 消费协议

技能库入口为 `/skills`。协议是构建时部署选择，普通用户无需选择后端类型。

| `VITE_SKILLS_API_PROTOCOL` | 固定 API namespace | 页面能力 |
| --- | --- | --- |
| `multirag-assets-v1`（默认） | `/api/v1/skill-assets` | Python 增强资产库：目录/ZIP 导入、不可变版本、显式活动版本、索引与持久任务重试 |
| `ragflow-skills-v1` | `/api/v1/skill-core`，通用 `/api/v1/files` | 上游核心：空间 CRUD、目录版本、默认最高三段数字版本、目录导入、配置、索引及检索 |

设置变量后重新构建。未知值明确失败，不按返回内容猜测协议，不探测或回退到
`/api/v1/skills`。后端该旧路径的 `SKILLS_API_PROTOCOL` alias 配置不改变 Web 的选择。
切换后端地址或协议时，空间、文件、版本和任务 ID 不保证可复用；数据导入导出由后端契约管理。

## 真实能力与状态

- 增强资产 namespace 必须提供 `capabilities.writable`。只读资产服务保留阅读和下载，
  不开放创建、修改或失败任务重试；不能仅根据 `backend_owner` 推断可以写。
- 核心 Space 使用公开状态 `active/deleting/deleted`，与数据库常量无关。
  删除 202 仅表示已受理；页面通过空间 ID 轮询 GET，明确 404 或 `deleted` 才显示结束。
  `delete_error.retryable` 提供重试入口；不会生成假的 operation ID。
- 核心目录导入通过真实 Files 创建/上传接口分步保存。部分失败保留已写文件并引导检查；
  文件全部保存也不表示索引可用。重建索引真实完成且 `failed_count=0` 后才显示就绪。
- 核心版本为文件夹，详情默认读取最高有效三段数字版本；没有这些目录时读取技能根目录。
  版本历史可浏览其他目录，不把默认最高版本称为显式活动版本。
- 核心模型选择使用 `/skill-core/models` 的精确字符串 ID。
  `/skill-protocols` 仅声明真实能力，不用于猜测用户选择的协议。
  核心服务声明不执行 rerank 时，配置页明确说明保存偏好不会改变结果。
- 核心空间列表是完整集合，页面本地分页；Files 遍历按服务端总数读取全部分页。
  未输入查询时直接通过 Files 列出技能目录，包括未索引内容；非空 query 使用索引检索。
  search 的空 query 也属于索引条目语义，页面不将其 total 当作目录总数。
- Files 删除成功遵守已确认的 `true | {success_count, errors}` 合同：Go 的布尔值只表达
  服务端成功，不推造删除计数；Python 检查真实批删细节，success_count 包含目录后代节点，不能等同输入 ids 数量。非零业务码和部分失败均拒绝。
- 文件预览默认显示 `SKILL.md` 正文，支持源文和下载。Markdown 不执行 HTML、不自动加载
  远程图片；文件内容和模型返回值都视为不可信输入。技能不会自动执行。

增强协议的服务器契约在后端仓 `docs/skills/CONTRACT.md`；架构调整见
`docs/skills/REALIGNMENT.md`。本文件只记录 Web 的配置和用户可观察行为，不替代后端合同。
