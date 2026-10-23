# D1 / D4 domain interaction handoff

## Knowledge document upload

文件：`src/pages/knowledge/documents/document-upload-modal.tsx`、`upload-feedback.ts`、对应 tests 与中英 knowledge catalog。

- HTTP 200 不再把所有待上传项标成成功：响应必须包含可匹配的 name 和独立非空 id，只确认能对应的文件。缺失项保留为待处理；未知文件、重复 id、缺字段与部分重名无法对应均不冒充成功。
- 部分成功只解析已确认的文档，列表在确认后刷新；重试只发送未成功文件。原生 File 的 bytes/name/size/prototype 保留。
- 批量上传和单项重试共用 busy guard；上传过程中不能并发重传或关闭。换知识库、关闭或卸载会使旧 session 结果失效，不触发新页面的 toast/parse/refetch。
- 移除 800ms 自动关闭；用户可检查上传与解析结果后手动关闭。解析失败仍保留已上传状态，避免再次上传已成功文件。
- 未可信错误/响应体不进入 UI、toast 或 console；错误 key 在渲染时翻译，切语言保留文件并同步错误文案。文件拒绝有固定恢复提示。
- 说明改为单个文件上限 1GB、每批最多 32 个，与现有 uploader 的 per-file maxSize 一致。

## Default model settings

文件：`src/pages/settings/model-providers/components/system-setting.tsx`、`src/hooks/use-default-model-request.ts`、对应 tests 与中英 settings catalog。

- 共享已有 tenant Query/key factory，不再手写 effect 请求；模型列表沿用既有 LLM hook 与启用状态过滤。
- 选择是本地 RHF + zod 草稿，点击保存才提交一个完整快照。请求中禁用修改并以同步 guard 拒绝重复保存，重置恢复最近确认值。
- 仅明确 `true` 的服务端 ack 成功后更新 Query cache；false/missing ack 与异常均保留草稿，使用固定脱敏中英文错误和重试。失败不伪装已保存。
- 未安装/不可用的既有模型值可见并原样保留；移除模糊 includes 规范化，避免把相似名称或其他 provider 模型静默选中。
- 迟到的旧 tenant 保存不能覆盖新 tenant cache，也不向已卸载表单播报成功。
- 视觉使用现有 SelectWithSearch/FormTooltip/Button 与 token；标签、提示、状态和反馈均走中英 locale。HTTP 路径与可配置模型字段保持现有接口。

## Verification and limits

- 真实 FileUploader 组件回归 3 tests，exit 0：原生文件、部分响应、仅失败项重传、远端错误脱敏、切语言留文件、旧 session 结果清理、解析失败区别于上传失败。
- 纯响应对应合同 3 tests，exit 0：部分结果、无效字段/重复 id/未知 name、重名输入歧义。
- 默认模型业务交互 4 tests，exit 0：多字段一次显式写、失败留稿/中英切换、false ack、并发拒绝与 tenant 切换。测试以 native select 替代共享 combobox，覆盖业务状态，不冒充共享控件的浏览器键盘测试。
- 与 locale / Widget / Desktop / existing local-model suites 合并 focused Vitest 53 tests，exit 0；相关生产源码 ESLint exit 0，无 warning。全量 catalog gate exit 0。
- 目前只忽略过期上传响应，没有取消已发出的 HTTP 请求；不声称取消服务端处理。没有真实存储/解析 worker 或付费模型请求验收。实际浏览器布局、明暗主题与生产构建由主 agent 统一检查。

本 worker 未提交、未推送，index 与集成门禁由主 agent 管理。
